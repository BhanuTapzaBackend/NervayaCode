import { NextRequest, NextResponse } from 'next/server';
import { validatePromoCode } from '@/lib/services/promo.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body?.code;
    if (!code || typeof code !== 'string') {
      return NextResponse.json(errorResponse('Code is required', null, 400), { status: 400 });
    }
    const promo = await validatePromoCode(code.trim());
    return NextResponse.json(
      successResponse('Promo code is valid', {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        valid: true,
      }),
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
