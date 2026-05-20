import { NextRequest, NextResponse } from 'next/server';
import { updateProfile } from '@/lib/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(errorResponse('Name is required', null, 400), { status: 400 });
    }

    const result = await updateProfile(authResult.user.userId, name);

    return NextResponse.json(successResponse('Profile updated successfully', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
