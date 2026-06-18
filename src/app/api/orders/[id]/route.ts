import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/services/order.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Single-order fetch including ALL item types (therapy, digital, supplements).
// Unlike GET /api/orders (which strips therapy items for the supplements view), this
// powers the order-success page so therapy-only orders are found.
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const order = await getOrderById(id);

    // Ownership: customers may only read their own orders; admins may read any.
    if (authResult.user.role !== ROLES.ADMIN && String(order.userId) !== authResult.user.userId) {
      return NextResponse.json(errorResponse('Order not found', null, 404), { status: 404 });
    }

    return NextResponse.json(successResponse('Order fetched successfully', order));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
