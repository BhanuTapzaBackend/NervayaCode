import { NextRequest, NextResponse } from 'next/server';
import Session from '@/lib/models/session.model';
import { getSessionById, cancelSession, updateSessionStatus } from '@/lib/services/session.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const session = await getSessionById(id);

    if (!session) {
      return NextResponse.json(errorResponse('Session not found', null, 404), { status: 404 });
    }

    // Ownership check: customers can only view their own sessions
    if (authResult.user.role === ROLES.CUSTOMER && session.userId.toString() !== authResult.user.userId) {
      return NextResponse.json(errorResponse('Not authorized to view this session', null, 403), { status: 403 });
    }

    // Therapists can only view sessions assigned to them
    if (authResult.user.role === ROLES.THERAPIST && session.therapistId.toString() !== authResult.user.userId) {
      return NextResponse.json(errorResponse('Not authorized to view this session', null, 403), { status: 403 });
    }

    return NextResponse.json(successResponse('Session fetched successfully', session));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const body = await req.json();

    // Handle meetLink update (admin/therapist only)
    if (
      body.meetLink !== undefined &&
      (authResult.user.role === ROLES.ADMIN || authResult.user.role === ROLES.THERAPIST)
    ) {
      const updated = await Session.findByIdAndUpdate(id, { meetLink: body.meetLink }, { new: true });
      if (!updated) {
        return NextResponse.json(errorResponse('Session not found', null, 404), { status: 404 });
      }
      if (!body.status) {
        return NextResponse.json(successResponse('Meet link updated successfully', updated));
      }
    }

    // Customers can only cancel their own sessions
    if (authResult.user.role === ROLES.CUSTOMER) {
      if (body.status !== 'cancelled') {
        return NextResponse.json(errorResponse('Customers can only cancel sessions', null, 403), { status: 403 });
      }
      const session = await cancelSession(id, authResult.user.userId);
      return NextResponse.json(successResponse('Session cancelled successfully', session));
    }

    // Only admin and therapist can update status to other values
    if (body.status === 'cancelled') {
      // Admin/therapist can cancel any session — use admin path
      const session = await updateSessionStatus(id, body.status);
      return NextResponse.json(successResponse('Session cancelled successfully', session));
    }

    // Validate state transitions: only confirmed and completed are allowed targets
    const allowedStatuses = ['confirmed', 'completed'];
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        errorResponse(`Invalid status transition. Allowed: ${allowedStatuses.join(', ')}`, null, 400),
        { status: 400 },
      );
    }

    const session = await updateSessionStatus(id, body.status);
    return NextResponse.json(successResponse('Session updated successfully', session));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth(req, [ROLES.CUSTOMER, ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const session = await cancelSession(id, authResult.user.userId);

    return NextResponse.json(successResponse('Session deleted successfully', session));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
