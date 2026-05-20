import { NextRequest, NextResponse } from 'next/server';
import { createDirectOrder } from '@/lib/services/order.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { itemType, itemId, quantity, name, price, image, metadata } = body;

    if (!itemType || !itemId || !quantity) {
      return NextResponse.json(errorResponse('Missing REQUIRED fields: itemType, itemId, quantity', null, 400), {
        status: 400,
      });
    }

    const order = await createDirectOrder(authResult.user.userId, {
      itemType,
      itemId,
      quantity,
      name,
      price,
      image,
      metadata,
    });

    return NextResponse.json(successResponse('Direct order created successfully', order, 201), {
      status: 201,
    });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
