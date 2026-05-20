import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { getSessionsByTherapistId } from '@/lib/services/session.service';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.THERAPIST]);
    if (authResult instanceof NextResponse) return authResult;

    await connectDB();
    const user = await User.findById(authResult.user.userId).select('therapistId').lean();
    if (!user?.therapistId) {
      return NextResponse.json(
        errorResponse('Therapist profile not linked to this account. Please contact admin.', null, 403),
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const sessions = await getSessionsByTherapistId(user.therapistId.toString(), status);
    return NextResponse.json(successResponse('Sessions fetched', sessions));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
