import { NextRequest, NextResponse } from 'next/server';
import {
  createSupplement,
  getActiveSupplements,
  getAllSupplements,
  getAllSupplementsPaginated,
} from '@/lib/services/supplement.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';

    if (adminView) {
      const authResult = await requireAuth(request, [ROLES.ADMIN]);
      if (authResult instanceof NextResponse) {
        return authResult;
      }
      const pageParam = searchParams.get('page');
      const limitParam = searchParams.get('limit');
      const usePagination = pageParam !== null && pageParam !== undefined;
      if (usePagination) {
        const page = Math.max(1, parseInt(pageParam || String(DEFAULT_PAGE), 10));
        const limit = Math.min(100, Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10)));
        const isActiveParam = searchParams.get('isActive');
        const search = searchParams.get('search') || undefined;
        const minStockParam = searchParams.get('minStock');
        const maxStockParam = searchParams.get('maxStock');
        const filters = {
          ...(isActiveParam === 'true' && { isActive: true }),
          ...(isActiveParam === 'false' && { isActive: false }),
          ...(search && { search }),
          ...(minStockParam !== null &&
            minStockParam !== undefined && {
              minStock: parseInt(minStockParam, 10),
            }),
          ...(maxStockParam !== null &&
            maxStockParam !== undefined && {
              maxStock: parseInt(maxStockParam, 10),
            }),
        };
        const result = await getAllSupplementsPaginated(page, limit, filters);
        return NextResponse.json(
          successResponse('Supplements fetched successfully', {
            data: result.data,
            meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
          }),
        );
      }
      const supplements = await getAllSupplements();
      return NextResponse.json(successResponse('Supplements fetched successfully', supplements));
    }

    const supplements = await getActiveSupplements();
    return NextResponse.json(successResponse('Supplements fetched successfully', supplements));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { name, description, price } = body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(errorResponse('Name is required', null, 400), { status: 400 });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json(errorResponse('Description is required', null, 400), { status: 400 });
    }
    if (price === undefined || typeof price !== 'number' || price < 0) {
      return NextResponse.json(errorResponse('Price must be a non-negative number', null, 400), { status: 400 });
    }

    const supplement = await createSupplement(body);
    return NextResponse.json(successResponse('Supplement created successfully', supplement, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
