import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { configService } from '@/lib/services/config.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import {
  SLEEP_BUNDLE_DISCOUNT_KEY,
  SLEEP_BUNDLE_DISCOUNT_MIN,
  SLEEP_BUNDLE_DISCOUNT_MAX,
  THERAPY_STARTING_PRICE_KEY,
  DEEP_REST_RECOMMENDATION_PRICE_KEY,
  SUPPLEMENT_RECOMMENDATION_PRICE_KEY,
} from '@/lib/constants/sleepPlan.constants';

const PRICE_CONFIG_KEYS = [
  THERAPY_STARTING_PRICE_KEY,
  DEEP_REST_RECOMMENDATION_PRICE_KEY,
  SUPPLEMENT_RECOMMENDATION_PRICE_KEY,
];

/** Validates pricing/discount config values. Returns an error message, or null when valid. */
function validateConfigValue(key: string, value: unknown): string | null {
  if (PRICE_CONFIG_KEYS.includes(key)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return 'Price must be a number greater than zero';
    }
  }
  if (key === SLEEP_BUNDLE_DISCOUNT_KEY) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < SLEEP_BUNDLE_DISCOUNT_MIN ||
      value > SLEEP_BUNDLE_DISCOUNT_MAX
    ) {
      return `Discount must be a number between ${SLEEP_BUNDLE_DISCOUNT_MIN} and ${SLEEP_BUNDLE_DISCOUNT_MAX}`;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const configs = await configService.getAllConfigs();
    return NextResponse.json(successResponse('Configurations retrieved', configs));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { key, value, isPublic, description } = body;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return NextResponse.json(errorResponse('Configuration key is required', null, 400), { status: 400 });
    }

    const validationError = validateConfigValue(key, value);
    if (validationError) {
      return NextResponse.json(errorResponse(validationError, null, 400), { status: 400 });
    }

    const updatedConfig = await configService.set(key, value, authResult.user.userId, isPublic, description);
    return NextResponse.json(successResponse('Configuration updated', updatedConfig));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
