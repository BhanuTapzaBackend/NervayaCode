import { NextRequest, NextResponse } from 'next/server';
import { createConsultationLead } from '@/lib/services/consultation.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const { firstName, lastName, connectionType, email, mobile, date, time } = body;

    // Basic validation
    if (!firstName || !lastName || !connectionType || !date || !time) {
      return NextResponse.json(
        errorResponse('Missing required fields: firstName, lastName, connectionType, date, time', null, 400),
        { status: 400 },
      );
    }

    if (connectionType === 'Video Call' && !email) {
      return NextResponse.json(errorResponse('Email is required for a Video Call consultation', null, 400), {
        status: 400,
      });
    }

    if (connectionType === 'Phone Call' && (!mobile || !/^\d{10}$/.test(mobile))) {
      return NextResponse.json(errorResponse('A valid 10-digit mobile number is required for Phone Call', null, 400), {
        status: 400,
      });
    }

    const lead = await createConsultationLead({
      firstName,
      lastName,
      connectionType,
      email: connectionType === 'Video Call' ? email : undefined,
      mobile: connectionType === 'Phone Call' ? mobile : undefined,
      date,
      time,
    });

    // Push to Zoho CRM — fire-and-forget. This is the only producer; the client
    // no longer pushes a second lead under a competing Lead_Source.
    //
    // A phone-call booking has no email, so none is sent. The old placeholder
    // ('no-email@nervaya.com') was shared by every such lead and, being a dedup
    // field, collapsed unrelated bookings onto one CRM record.
    (async () => {
      try {
        const { pushConsultationLeadToZoho, pushLeadSafely } = await import('@/lib/zoho/zoho-crm.service');
        pushLeadSafely('consultation', () =>
          pushConsultationLeadToZoho({
            name: `${firstName} ${lastName}`,
            email: connectionType === 'Video Call' ? email : undefined,
            phone: mobile,
            message: `Automated consultation request via ${connectionType} at ${date} ${time}`,
          }),
        );
      } catch (error) {
        console.error('[Zoho] consultation lead push failed:', error);
      }
    })();

    return NextResponse.json(successResponse('Consultation scheduled successfully', lead, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
