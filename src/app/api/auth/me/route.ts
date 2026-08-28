import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { ApiError } from '@/types/error.types';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/user.model';
import { generateToken, shouldRenewToken } from '@/lib/utils/jwt.util';
import { COOKIE_NAMES, getSecureCookieOptions } from '@/utils/cookieConstants';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    await connectDB();
    const user = await User.findById(authResult.user.userId);
    if (!user) {
      return NextResponse.json(errorResponse('User not found', null, 401), { status: 401 });
    }

    const response = NextResponse.json(
      successResponse('Authenticated', {
        user: {
          _id: user._id.toString(),
          // Explicitly nullable, not omitted: the client must be able to tell
          // "this account has no number" from "the server didn't send one".
          phone: user.phone ?? null,
          phoneVerified: Boolean(user.phoneVerified),
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl || '',
          authProviders: user.authProviders ?? [],
          ...(user.therapistId && { therapistId: user.therapistId.toString() }),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      }),
      { status: 200 },
    );

    // Two reasons to re-issue the token, both handled here because AuthContext
    // calls this endpoint on every mount:
    //
    //  1. Role drift. The JWT bakes in `role` and there is no revocation path,
    //     so a user promoted to THERAPIST (or demoted) would keep their old
    //     routing until expiry — middleware reads the token, not the database.
    //  2. Sliding renewal. A fixed expiry would sign an active user out
    //     mid-action on the last day; refreshing past the halfway mark means
    //     the window is "5 days since you last used the app", not "5 days since
    //     you logged in". Someone genuinely idle still ages out on schedule.
    const roleChanged = user.role !== authResult.user.role;
    if (roleChanged || shouldRenewToken(authResult.user.exp)) {
      const token = await generateToken(user._id.toString(), user.role);
      response.cookies.set(COOKIE_NAMES.AUTH_TOKEN, token, getSecureCookieOptions());
    }

    return response;
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error as ApiError);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
