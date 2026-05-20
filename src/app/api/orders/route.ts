import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getUserOrders, getAllOrders } from '@/lib/services/order.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const isAdmin = authResult.user.role === ROLES.ADMIN;
    const adminView = searchParams.get('admin') === 'true';

    if (isAdmin && adminView) {
      const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
      const orderStatus = searchParams.get('orderStatus') || undefined;
      const paymentStatus = searchParams.get('paymentStatus') || undefined;
      const dateFrom = searchParams.get('dateFrom') || undefined;
      const dateTo = searchParams.get('dateTo') || undefined;
      const minAmountParam = searchParams.get('minAmount');
      const maxAmountParam = searchParams.get('maxAmount');
      const userId = searchParams.get('userId') || undefined;
      const filters = {
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(userId && { userId }),
        ...(minAmountParam !== null &&
          minAmountParam !== undefined &&
          !Number.isNaN(Number(minAmountParam)) && {
            minAmount: Number(minAmountParam),
          }),
        ...(maxAmountParam !== null &&
          maxAmountParam !== undefined &&
          !Number.isNaN(Number(maxAmountParam)) && {
            maxAmount: Number(maxAmountParam),
          }),
      };
      const result = await getAllOrders(page, limit, Object.keys(filters).length > 0 ? filters : undefined);
      return NextResponse.json(
        successResponse('Orders fetched successfully', {
          data: result.data,
          meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
        }),
      );
    }

    const orders = await getUserOrders(authResult.user.userId);
    return NextResponse.json(successResponse('Orders fetched successfully', orders));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { shippingAddress, promoCode, promoDiscount } = body;

    if (shippingAddress) {
      if (typeof shippingAddress !== 'object') {
        return NextResponse.json(errorResponse('Shipping address must be an object', null, 400), { status: 400 });
      }

      const requiredFields = ['name', 'phone', 'addressLine1', 'city', 'state', 'zipCode', 'country'];
      for (const field of requiredFields) {
        if (!shippingAddress[field]) {
          return NextResponse.json(errorResponse(`Shipping address ${field} is required`, null, 400), { status: 400 });
        }
      }
    }

    const order = await createOrder(authResult.user.userId, {
      shippingAddress,
      ...(promoCode != null && { promoCode }),
      ...(promoDiscount != null && typeof promoDiscount === 'number' && { promoDiscount }),
    });
    return NextResponse.json(successResponse('Order created successfully', order, 201), {
      status: 201,
    });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
