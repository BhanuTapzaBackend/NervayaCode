/**
 * Verifies that concurrent bookings of one slot cannot both succeed.
 *
 * The booking form greys out taken slots, but that is cosmetic — the real
 * guarantee is that two people clicking "book" in the same millisecond cannot
 * both win. That cannot be checked by clicking, so it is checked here.
 *
 * Run: npx tsx scripts/verify-slot-race.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import ConsultationSchedule from '../src/lib/models/consultationSchedule.model';
import { generateRange, claimSlot } from '../src/lib/services/consultation-schedule.service';

const TEST_DATE = '2099-01-01'; // far future — never collides with real data
const CONCURRENT_BOOKERS = 25;

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  await ConsultationSchedule.deleteOne({ date: TEST_DATE });

  await generateRange({
    fromDate: TEST_DATE,
    toDate: TEST_DATE,
    startTime: '09:00',
    endTime: '09:30',
    slotMinutes: 30,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
  });

  const results = await Promise.all(
    Array.from({ length: CONCURRENT_BOOKERS }, () => claimSlot(TEST_DATE, '9:00 AM', new mongoose.Types.ObjectId())),
  );

  const winners = results.filter(Boolean).length;

  // The slot must also be booked exactly once in the database, not merely
  // reported as booked once.
  const schedule = await ConsultationSchedule.findOne({ date: TEST_DATE });
  const bookedCopies = (schedule?.slots ?? []).filter((slot) => slot.startTime === '9:00 AM' && slot.leadId !== null);

  console.log(`${CONCURRENT_BOOKERS} concurrent claims -> ${winners} winner(s)`);
  console.log(`slot copies holding a booking in the DB -> ${bookedCopies.length}`);

  await ConsultationSchedule.deleteOne({ date: TEST_DATE });
  await mongoose.disconnect();

  if (winners !== 1 || bookedCopies.length !== 1) {
    console.error(`FAIL: expected exactly 1 winner and 1 booked copy, got ${winners} and ${bookedCopies.length}.`);
    process.exit(1);
  }
  console.log('PASS: exactly one booker won the slot.');
}

void main();
