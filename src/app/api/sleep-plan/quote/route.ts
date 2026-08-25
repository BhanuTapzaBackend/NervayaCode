import { NextRequest, NextResponse } from 'next/server';
import { parseServices, resolvePlanPricing } from '@/lib/services/sleep-plan.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

/**
 * Priced quote for a set of recommended services.
 *
 * Public and read-only: the recommendation renders from this instead of pricing
 * locally, so what the customer is shown comes from the same function that
 * prices the order they are charged for.
 */
export async function GET(request: NextRequest) {
  try {
    const services = parseServices(request.nextUrl.searchParams.get('services'));
    const pricing = await resolvePlanPricing(services);
    return NextResponse.json(successResponse('Plan quote', pricing));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
