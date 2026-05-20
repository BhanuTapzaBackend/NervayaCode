import { NextRequest, NextResponse } from 'next/server';
import { createSession, getUserSessions, getAllSessions } from '@/lib/services/session.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(req.url);
    const isAdmin = authResult.user.role === ROLES.ADMIN;
    const adminView = searchParams.get('admin') === 'true';

    if (isAdmin && adminView) {
      const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
      const status = searchParams.get('status') || undefined;
      const therapistId = searchParams.get('therapistId') || undefined;
      const dateFrom = searchParams.get('dateFrom') || undefined;
      const dateTo = searchParams.get('dateTo') || undefined;
      const search = searchParams.get('search') || undefined;
      const filters = {
        ...(status && { status }),
        ...(therapistId && { therapistId }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(search && { search }),
      };
      const result = await getAllSessions(page, limit, Object.keys(filters).length > 0 ? filters : undefined);
      return NextResponse.json(
        successResponse('Sessions fetched successfully', {
          data: result.data,
          meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
        }),
      );
    }

    const statusFilter = searchParams.get('status') || undefined;
    const sessions = await getUserSessions(authResult.user.userId, statusFilter);

    return NextResponse.json(successResponse('Sessions fetched successfully', sessions));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { therapistId, date, startTime } = body;

    if (!therapistId || !date || !startTime) {
      return NextResponse.json(errorResponse('Missing required fields: therapistId, date, startTime', null, 400), {
        status: 400,
      });
    }

    // Validate date format (YYYY-MM-DD)
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date).getTime())) {
      return NextResponse.json(errorResponse('Invalid date format. Expected YYYY-MM-DD', null, 400), { status: 400 });
    }

    // Validate time format (e.g. "9:00 AM", "12:00 PM")
    if (typeof startTime !== 'string' || !/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(startTime)) {
      return NextResponse.json(errorResponse('Invalid time format. Expected "H:MM AM/PM"', null, 400), { status: 400 });
    }

    const session = await createSession(authResult.user.userId, therapistId, date, startTime);

    return NextResponse.json(successResponse('Session booked successfully', session, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
