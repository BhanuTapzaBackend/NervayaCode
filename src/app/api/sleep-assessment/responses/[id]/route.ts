import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentById, deleteAssessment } from '@/lib/services/sleepAssessmentResponse.service';
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
    const ownerFilter = authResult.user.role === ROLES.CUSTOMER ? authResult.user.userId : undefined;
    const assessment = await getAssessmentById(id, ownerFilter);

    return NextResponse.json(successResponse('Assessment fetched successfully', assessment));
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
    await deleteAssessment(id);

    return NextResponse.json(successResponse('Assessment deleted successfully'));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
