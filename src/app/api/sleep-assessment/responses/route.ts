import { NextRequest, NextResponse } from 'next/server';
import {
  submitAssessment,
  getUserAssessments,
  getLatestUserAssessment,
  getAllAssessments,
  getInProgressAssessment,
  saveAnswer,
} from '@/lib/services/sleepAssessmentResponse.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(req.url);
    const latestOnly = searchParams.get('latest') === 'true';
    const inProgressOnly = searchParams.get('inProgress') === 'true';
    const allUsers = searchParams.get('allUsers') === 'true';

    if (allUsers && authResult.user.role === ROLES.ADMIN) {
      const assessments = await getAllAssessments();
      return NextResponse.json(successResponse('All assessments fetched successfully', assessments));
    }

    if (inProgressOnly) {
      const assessment = await getInProgressAssessment(authResult.user.userId);
      return NextResponse.json(successResponse('In-progress assessment fetched successfully', assessment ?? null));
    }

    if (latestOnly) {
      const assessment = await getLatestUserAssessment(authResult.user.userId);
      return NextResponse.json(successResponse('Latest assessment fetched successfully', assessment));
    }

    const assessments = await getUserAssessments(authResult.user.userId);

    return NextResponse.json(successResponse('Assessments fetched successfully', assessments));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { answers } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(errorResponse('Answers array is required', null, 400), { status: 400 });
    }

    const response = await submitAssessment(authResult.user.userId, {
      answers,
    });

    return NextResponse.json(successResponse('Assessment submitted successfully', response, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { questionId, answer } = body;

    if (!questionId || typeof questionId !== 'string') {
      return NextResponse.json(errorResponse('questionId is required', null, 400), { status: 400 });
    }

    if (answer === undefined) {
      return NextResponse.json(errorResponse('answer is required', null, 400), { status: 400 });
    }

    const response = await saveAnswer(authResult.user.userId, {
      questionId,
      answer: answer as string | string[],
    });

    return NextResponse.json(successResponse('Answer saved successfully', response));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
