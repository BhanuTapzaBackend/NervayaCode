import { NextRequest, NextResponse } from 'next/server';
import { getConsultingHours, updateConsultingHours } from '@/lib/services/therapist.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: therapistId } = await params;
    const consultingHours = await getConsultingHours(therapistId);
    return NextResponse.json(successResponse('Consulting hours fetched successfully', consultingHours));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN, ROLES.THERAPIST]);
    if (authResult instanceof NextResponse) return authResult;

    const { id: therapistId } = await params;

    if (authResult.user.role === ROLES.THERAPIST) {
      await connectDB();
      const user = await User.findById(authResult.user.userId).select('therapistId').lean();
      if (!user?.therapistId || user.therapistId.toString() !== therapistId) {
        return NextResponse.json(errorResponse('You can only update your own consulting hours', null, 403), {
          status: 403,
        });
      }
    }

    const body = await req.json();
    const { consultingHours } = body;

    if (!Array.isArray(consultingHours)) {
      return NextResponse.json(errorResponse('consultingHours must be an array', null, 400), { status: 400 });
    }

    const updatedHours = await updateConsultingHours(therapistId, consultingHours);
    return NextResponse.json(successResponse('Consulting hours updated successfully', updatedHours));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
