import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { getSessionById } from '@/lib/services/session.service';
import { getRoomName, mintJaasToken } from '@/lib/services/jitsi.service';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.THERAPIST, ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    await connectDB();

    const session = await getSessionById(id);
    if (!session) {
      return NextResponse.json(errorResponse('Session not found', null, 404), { status: 404 });
    }

    const { role, userId } = authResult.user;

    // The page route is shared across roles; participant authorization is enforced here.
    let authorized = false;
    let isModerator = false;

    if (role === ROLES.ADMIN) {
      authorized = true;
      isModerator = true;
    } else if (role === ROLES.CUSTOMER) {
      authorized = session.userId.toString() === userId;
    } else if (role === ROLES.THERAPIST) {
      // Therapists are Users whose therapistId links to the Therapist on the session.
      const therapistUser = await User.findById(userId).select('therapistId').lean();
      authorized =
        !!therapistUser?.therapistId && therapistUser.therapistId.toString() === session.therapistId.toString();
      isModerator = true;
    }

    if (!authorized) {
      return NextResponse.json(errorResponse('Not authorized to join this session', null, 403), { status: 403 });
    }

    const me = await User.findById(userId).select('name email').lean();
    const roomName = getRoomName(id);
    const token = await mintJaasToken(roomName, {
      id: userId,
      name: me?.name || 'Nervaya User',
      email: me?.email || undefined,
      isModerator,
    });

    if (!token) {
      return NextResponse.json(errorResponse('Video service is not configured', null, 503), { status: 503 });
    }

    return NextResponse.json(
      successResponse('Session token generated', {
        token,
        roomName,
        appId: process.env.NEXT_PUBLIC_JAAS_APP_ID,
      }),
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
