import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { parseServices } from '@/lib/services/sleep-plan.service';
import { createSleepPlanOrder } from '@/lib/services/sleep-plan-checkout.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

/**
 * Creates the pending order for a sleep plan and holds its therapy slot.
 *
 * Note what this deliberately does NOT accept: a price. The body carries intent
 * only — services, therapist, slot, address — and every amount is resolved
 * server-side from admin config.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const services = parseServices(body?.services);

    const { order, pricing } = await createSleepPlanOrder(authResult.user.userId, {
      services,
      therapy: body?.therapy,
      shippingAddress: body?.shippingAddress,
    });

    return NextResponse.json(successResponse('Sleep plan order created', { order, pricing }, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
