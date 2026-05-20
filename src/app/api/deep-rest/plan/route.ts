import { NextResponse } from 'next/server';
import { configService } from '@/lib/services/config.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { DRIFT_OFF_SESSION_PRICE } from '@/lib/constants/driftOff.constants';
import { DEEP_REST_SESSION_PRICE_CONFIG_KEY } from '@/lib/constants/deepRest.constants';

export async function GET() {
  try {
    const dbPrice = await configService.get(DEEP_REST_SESSION_PRICE_CONFIG_KEY);
    const price = typeof dbPrice === 'number' ? dbPrice : DRIFT_OFF_SESSION_PRICE;
    return NextResponse.json(successResponse('Deep Rest plan fetched', { price }));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
