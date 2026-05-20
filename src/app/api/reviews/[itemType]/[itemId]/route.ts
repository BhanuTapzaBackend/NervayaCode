import { NextRequest, NextResponse } from 'next/server';
import { getByItemType } from '@/lib/services/review.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

const VALID_ITEM_TYPES = ['Supplement', 'DriftOff', 'Therapy'];

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemType: string; itemId: string }> }) {
  try {
    const { itemType, itemId } = await params;

    if (!VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json(errorResponse('Invalid item type', null, 400), { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));

    const result = await getByItemType(itemId, itemType, page, limit);
    return NextResponse.json(successResponse('Reviews fetched', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
