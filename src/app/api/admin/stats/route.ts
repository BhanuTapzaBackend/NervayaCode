import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/services/adminStats.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const stats = await getDashboardStats();
    return NextResponse.json(successResponse('Dashboard stats fetched successfully', stats));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
