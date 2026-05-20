import { NextRequest, NextResponse } from 'next/server';
import { generateSlotsFromConsultingHours } from '@/lib/services/therapistSchedule.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN, ROLES.THERAPIST]);
    if (authResult instanceof NextResponse) return authResult;

    const { id: therapistId } = await params;

    if (authResult.user.role === ROLES.THERAPIST) {
      await connectDB();
      const user = await User.findById(authResult.user.userId).select('therapistId').lean();
      if (!user?.therapistId || user.therapistId.toString() !== therapistId) {
        return NextResponse.json(errorResponse('You can only generate slots for your own profile', null, 403), {
          status: 403,
        });
      }
    }
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get('days');
    const numberOfDays = daysParam ? parseInt(daysParam, 10) : 30;

    const result = await generateSlotsFromConsultingHours(therapistId, new Date(), numberOfDays);

    return NextResponse.json(
      successResponse('Generated schedules successfully', {
        insertedCount: result.insertedCount || 0,
        modifiedCount: result.modifiedCount || 0,
      }),
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
