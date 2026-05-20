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
    // Fetches the user's name, email, and phone (phone ready for future collection)
    // then upserts the lead: new users → create, returning users → update.
    (async () => {
      try {
        const [{ default: User }, { pushAssessmentLeadToZoho }] = await Promise.all([
          import('@/lib/models/user.model'),
          import('@/lib/zoho/zoho-crm.service'),
        ]);
        const user = await User.findById(authResult.user.userId).select('name email phone').lean();
        if (user && user.email && user.name) {
          const scoreLabel = getSleepScoreLabel(response);
          await pushAssessmentLeadToZoho(
            user.name,
            user.email,
            scoreLabel,
            user.phone ?? undefined, // phone: populated automatically when collected in future
          );
        }
      } catch {
        // Silently swallow — Zoho errors must never affect the user
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
