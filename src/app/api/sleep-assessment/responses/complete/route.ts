import { NextRequest, NextResponse } from 'next/server';
import { completeAssessment } from '@/lib/services/sleepAssessmentResponse.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { getSleepScoreLabel } from '@/lib/utils/sleepScore.util';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const response = await completeAssessment(authResult.user.userId);

    // Push to Zoho CRM — fire-and-forget, never blocks the user response.
    // Signup is phone-first and email is optional, so the lead is keyed on
    // whichever identifiers the user actually has.
    (async () => {
      try {
        const [{ default: User }, { pushAssessmentLeadToZoho, pushLeadSafely }] = await Promise.all([
          import('@/lib/models/user.model'),
          import('@/lib/zoho/zoho-crm.service'),
        ]);
        const user = await User.findById(authResult.user.userId).select('name email phone').lean();
        if (user?.name && (user.email || user.phone)) {
          const scoreLabel = getSleepScoreLabel(response);
          pushLeadSafely('sleep assessment', () =>
            pushAssessmentLeadToZoho(user.name, user.email ?? undefined, scoreLabel, user.phone ?? undefined),
          );
        }
      } catch (error) {
        console.error('[Zoho] sleep assessment lead lookup failed:', error);
      }
    })();

    return NextResponse.json(successResponse('Assessment completed successfully', response));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
