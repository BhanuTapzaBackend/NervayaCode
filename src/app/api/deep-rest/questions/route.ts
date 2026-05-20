import { NextRequest, NextResponse } from 'next/server';
import {
  getAllActiveDriftOffQuestions,
  getAllDriftOffQuestions,
  getActiveOptionBasedDriftOffQuestions,
  createDriftOffQuestion,
} from '@/lib/services/driftOffQuestion.service';
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
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const isAdmin = authResult.user.role === ROLES.ADMIN;
    const questions =
      isAdmin && includeInactive
        ? await getAllDriftOffQuestions()
        : isAdmin
          ? await getAllActiveDriftOffQuestions()
          : await getActiveOptionBasedDriftOffQuestions();

    return NextResponse.json(successResponse('Deep Rest questions fetched successfully', questions));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { questionText, questionType, options, order, isRequired, isActive } = body;

    if (!questionText || !questionType || !order) {
      return NextResponse.json(errorResponse('Missing required fields: questionText, questionType, order', null, 400), {
        status: 400,
      });
    }

    const optionBasedTypes = ['single_choice', 'multiple_choice', 'scale'];
    if (questionType === 'text' || !optionBasedTypes.includes(questionType)) {
      return NextResponse.json(
        errorResponse('Only option-based question types are allowed: single_choice, multiple_choice, scale', null, 400),
        { status: 400 },
      );
    }

    if (!options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(errorResponse('At least 2 options are required for option-based questions', null, 400), {
        status: 400,
      });
    }

    const question = await createDriftOffQuestion({
      questionText,
      questionType,
      options: options || [],
      order,
      isRequired,
      isActive,
    });

    return NextResponse.json(successResponse('Deep Rest question created successfully', question, 201), {
      status: 201,
    });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
