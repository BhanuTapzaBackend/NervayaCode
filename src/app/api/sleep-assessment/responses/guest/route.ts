import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { generateGuestSessionId, readGuestSessionId, setGuestSessionCookie } from '@/lib/utils/guestSession.util';
import { getGuestAssessment, submitGuestAssessment } from '@/lib/services/guestSleepAssessment.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { answers } = body as { answers?: unknown };
    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(errorResponse('Answers array is required', null, 400), { status: 400 });
    }

    const existingGuestId = readGuestSessionId(req);
    const guestSessionId = existingGuestId ?? generateGuestSessionId();

    const saved = await submitGuestAssessment(guestSessionId, {
      answers: answers as { questionId: string; answer: string | string[] }[],
    });

    const response = NextResponse.json(successResponse('Guest assessment submitted successfully', saved, 201), {
      status: 201,
    });

    if (!existingGuestId) {
      setGuestSessionCookie(response, guestSessionId);
    }

    return response;
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}

export async function GET(req: NextRequest) {
  try {
    const guestSessionId = readGuestSessionId(req);
    if (!guestSessionId) {
      return NextResponse.json(errorResponse('No guest assessment found', null, 404), { status: 404 });
    }

    const assessment = await getGuestAssessment(guestSessionId);
    if (!assessment) {
      return NextResponse.json(errorResponse('No guest assessment found', null, 404), { status: 404 });
    }

    return NextResponse.json(successResponse('Guest assessment fetched successfully', assessment));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
