import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils/jwt.util';
import { COOKIE_NAMES } from '@/utils/cookieConstants';
import { Role } from '@/lib/constants/roles';

export interface AuthUser {
  userId: string;
  role: Role;
  /** Token expiry (epoch seconds), so routes can slide the session forward. */
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

export async function authenticateRequest(request: NextRequest): Promise<{ user: AuthUser } | NextResponse> {
  const token = request.cookies.get(COOKIE_NAMES.AUTH_TOKEN)?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: 'Authentication required', data: null }, { status: 401 });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    const response = NextResponse.json(
      { success: false, message: 'Invalid or expired token', data: null },
      { status: 401 },
    );
    response.cookies.delete(COOKIE_NAMES.AUTH_TOKEN);
    return response;
  }

  return { user: { userId: decoded.userId, role: decoded.role, exp: decoded.exp } };
}

export async function requireAuth(
  request: NextRequest,
  allowedRoles?: Role[],
): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await authenticateRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (allowedRoles && !allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json({ success: false, message: 'Insufficient permissions', data: null }, { status: 403 });
  }

  return authResult;
}
