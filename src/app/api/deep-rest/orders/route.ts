import { NextRequest, NextResponse } from 'next/server';
import { createDriftOffOrder, getDriftOffOrdersByUser } from '@/lib/services/driftOffOrder.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { DRIFT_OFF_SESSION_PRICE } from '@/lib/constants/driftOff.constants';
import { DEEP_REST_SESSION_PRICE_CONFIG_KEY } from '@/lib/constants/deepRest.constants';
import { configService } from '@/lib/services/config.service';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));

    const result = await getDriftOffOrdersByUser(authResult.user.userId, page, limit);
    return NextResponse.json(successResponse('Deep Rest orders retrieved', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    // Same guard as GET /api/deep-rest/plan, which is what the user was quoted.
    // A non-numeric config value (an admin saving "499" as text) would otherwise
    // be charged as-is here while the plan page fell back to the constant.
    const dbPrice = await configService.get(DEEP_REST_SESSION_PRICE_CONFIG_KEY);
    const finalPrice = typeof dbPrice === 'number' ? dbPrice : DRIFT_OFF_SESSION_PRICE;

    const order = await createDriftOffOrder(authResult.user.userId, finalPrice);

    return NextResponse.json(successResponse('Deep Rest order created', order, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
