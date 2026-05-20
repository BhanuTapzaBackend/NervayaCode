import { NextResponse } from 'next/server';
import ConsultationLead from '@/lib/models/consultationLead.model';
import connectDB from '@/lib/db/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // YYYY-MM or YYYY-MM-DD

    await connectDB();

    if (date && date.split('-').length === 3) {
      // Find bookings for specific date
      const bookings = await ConsultationLead.find({
        date,
        status: { $ne: 'cancelled' },
      }).select('time');
      return NextResponse.json(bookings);
    }

    // Start of the month
    const startOfMonth = new Date(`${date}-01T00:00:00Z`);
    // End of the month
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

    // Find all bookings for this month
    const bookings = await ConsultationLead.find({
      date: {
        $gte: startOfMonth.toISOString().split('T')[0],
        $lte: endOfMonth.toISOString().split('T')[0],
      },
      status: { $ne: 'cancelled' },
    });

    // Total possible slots per day (9 AM - 6 PM, 30 min slots = 18 slots)
    const TOTAL_SLOTS_PER_DAY = 18;

    // Group by date
    const availabilityMap: Record<string, number> = {};

    // Initialize days in month
    const daysInMonth = endOfMonth.getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = String(i).padStart(2, '0');
      const dateKey = `${date}-${d}`;
      availabilityMap[dateKey] = TOTAL_SLOTS_PER_DAY;
    }

    // Subtract bookings
    bookings.forEach((booking) => {
      if (availabilityMap[booking.date]) {
        availabilityMap[booking.date]--;
      }
    });

    return NextResponse.json(availabilityMap);
  } catch (_error: unknown) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
