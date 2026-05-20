import { NextRequest, NextResponse } from 'next/server';
import { applyPromoCode } from '@/lib/services/promo.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    const { code, cartId, cartTotal } = body;
    if (!code || typeof code !== 'string') {
      return NextResponse.json(errorResponse('Code is required', null, 400), { status: 400 });
    }
    const cartTotalNum = Number(cartTotal);
    if (Number.isNaN(cartTotalNum) || cartTotalNum < 0) {
      return NextResponse.json(errorResponse('Valid cart total is required', null, 400), {
        status: 400,
      });
    }
    const { discount, promoCode } = await applyPromoCode(code.trim(), cartId ?? '', cartTotalNum);
    return NextResponse.json(
      successResponse('Promo code applied', {
        discount,
        promoCode: {
          _id: promoCode._id,
          code: promoCode.code,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          minPurchase: promoCode.minPurchase,
          maxDiscount: promoCode.maxDiscount,
          expiryDate: promoCode.expiryDate,
          usageLimit: promoCode.usageLimit,
          usedCount: promoCode.usedCount,
          isActive: promoCode.isActive,
          description: promoCode.description,
          createdAt: promoCode.createdAt,
          updatedAt: promoCode.updatedAt,
        },
      }),
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
