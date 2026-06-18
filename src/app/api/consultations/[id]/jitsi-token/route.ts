import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { getConsultationRoomName, mintJaasToken } from '@/lib/services/jitsi.service';
import ConsultationLead from '@/lib/models/consultationLead.model';
import connectDB from '@/lib/db/mongodb';
import { Types } from 'mongoose';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Public endpoint: free 1-on-1 consultation leads are not logged-in users, so the
// unguessable lead id from the invite link acts as the access capability.
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(errorResponse('Consultation not found', null, 404), { status: 404 });
    }

    await connectDB();
    const lead = await ConsultationLead.findById(id).select('firstName lastName connectionType status').lean();

    if (!lead || lead.connectionType !== 'Video Call' || lead.status === 'cancelled') {
      return NextResponse.json(errorResponse('Consultation not found', null, 404), { status: 404 });
    }

    const roomName = getConsultationRoomName(id);
    const token = await mintJaasToken(roomName, {
      id,
      name: `${lead.firstName} ${lead.lastName}`.trim() || 'Guest',
      isModerator: false,
    });

    if (!token) {
      return NextResponse.json(errorResponse('Video service is not configured', null, 503), { status: 503 });
    }

    return NextResponse.json(
      successResponse('Consultation token generated', {
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
