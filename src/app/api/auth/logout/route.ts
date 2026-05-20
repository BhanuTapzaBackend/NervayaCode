import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/utils/response.util';
import { COOKIE_NAMES } from '@/utils/cookieConstants';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json(successResponse('Logout successful', null), { status: 200 });

  response.cookies.set(COOKIE_NAMES.AUTH_TOKEN, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
