import { NextRequest, NextResponse } from 'next/server';
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  toggleQuestionActive,
} from '@/lib/services/sleepAssessmentQuestion.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const question = await getQuestionById(id);

    return NextResponse.json(successResponse('Question fetched successfully', question));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { questionText, questionType, options, order, isRequired, isActive } = body;

    const optionBasedTypes = ['single_choice', 'multiple_choice', 'scale'];
    if (questionType === 'text' || (questionType && !optionBasedTypes.includes(questionType))) {
      return NextResponse.json(
        errorResponse('Only option-based question types are allowed: single_choice, multiple_choice, scale', null, 400),
        { status: 400 },
      );
    }

    if (options !== undefined && (!Array.isArray(options) || options.length < 2)) {
      return NextResponse.json(errorResponse('At least 2 options are required for option-based questions', null, 400), {
        status: 400,
      });
    }

    const question = await updateQuestion(id, {
      questionText,
      questionType,
      options,
      order,
      isRequired,
      isActive,
    });

    return NextResponse.json(successResponse('Question updated successfully', question));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const body = await req.json();

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(errorResponse('isActive must be a boolean', null, 400), { status: 400 });
    }

    const question = await toggleQuestionActive(id, body.isActive);

    return NextResponse.json(successResponse('Question status updated successfully', question));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    await deleteQuestion(id);

    return NextResponse.json(successResponse('Question deleted successfully'));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
