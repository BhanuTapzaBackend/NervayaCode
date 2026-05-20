import { NextRequest, NextResponse } from 'next/server';
import { resetUserAssessmentsByEmail } from '@/lib/services/sleepAssessmentResponse.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const body = (await req.json()) as { email?: string };
    const email = body?.email;

    if (!email) {
      return NextResponse.json(errorResponse('Email is required', null, 400), { status: 400 });
    }

    const result = await resetUserAssessmentsByEmail(email);

    return NextResponse.json(
      successResponse(
        result.deletedCount > 0
          ? `Reset complete — removed ${result.deletedCount} assessment ${result.deletedCount === 1 ? 'response' : 'responses'} for ${result.userEmail}`
          : `No assessment responses found for ${result.userEmail}; nothing to reset.`,
        result,
      ),
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
