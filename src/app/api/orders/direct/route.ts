import { NextRequest, NextResponse } from 'next/server';
import { createDirectOrder } from '@/lib/services/order.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { requirePhone } from '@/lib/middleware/phone-gate';
import { ROLES } from '@/lib/constants/roles';
import { ITEM_TYPE } from '@/lib/constants/enums';
import { isSlotInPast } from '@/lib/utils/sessionDateTime.util';

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

    // Therapy sessions deliver their meeting link and reminders over WhatsApp,
    // so a number is genuinely required here. Supplements are gated separately
    // at checkout, where the shipping address is collected.
    if (itemType === ITEM_TYPE.THERAPY) {
      const phoneGate = await requirePhone(authResult.user.userId);
      if (phoneGate) return phoneGate;
    }

    // Therapy slots can't be booked once their start time has passed (don't take payment for them).
    if (
      itemType === ITEM_TYPE.THERAPY &&
      metadata?.date &&
      metadata?.slot &&
      isSlotInPast(metadata.date, metadata.slot)
    ) {
      return NextResponse.json(
        errorResponse('This time slot has already passed. Please choose a later slot.', null, 400),
        { status: 400 },
      );
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
