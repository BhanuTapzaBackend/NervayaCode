import { NextRequest, NextResponse } from 'next/server';
import { resetUserAssessmentsByPhone } from '@/lib/services/sleepAssessmentResponse.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { validatePhone } from '@/lib/utils/validation.util';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const body = (await req.json()) as { phone?: string };
    const phone = body?.phone;

    if (!phone) {
      return NextResponse.json(errorResponse('Phone number is required', null, 400), { status: 400 });
    }

    if (!validatePhone(phone)) {
      return NextResponse.json(errorResponse('Invalid phone number format (e.g., +919876543210)', null, 400), {
        status: 400,
      });
    }

    const result = await resetUserAssessmentsByPhone(phone);

    return NextResponse.json(
      successResponse(
        result.deletedCount > 0
          ? `Reset complete — removed ${result.deletedCount} assessment ${result.deletedCount === 1 ? 'response' : 'responses'} for ${result.userPhone}`
          : `No assessment responses found for ${result.userPhone}; nothing to reset.`,
        result,
      ),
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
