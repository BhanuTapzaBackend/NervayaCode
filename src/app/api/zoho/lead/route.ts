import { NextRequest, NextResponse } from 'next/server';
import { getZohoAccessToken } from '@/lib/zoho/zoho-auth';
import { ZohoCRMResponse, ZohoLeadPayload, CreateLeadRequest } from '@/lib/zoho/types';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError, AppError } from '@/lib/utils/error.util';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/zoho/lead
//
// Receives lead data from the frontend and pushes it to Zoho CRM.
// Uses the UPSERT endpoint to prevent duplicate leads based on Email/Phone.
// ─────────────────────────────────────────────────────────────────────────────

function buildLeadPayload(body: CreateLeadRequest): ZohoLeadPayload {
  return {
    Last_Name: body.lastName,
    ...(body.firstName && { First_Name: body.firstName }),
    ...(body.email && { Email: body.email }),
    ...(body.phone && { Phone: body.phone }),
    ...(body.company && { Company: body.company }),
    ...(body.source && { Lead_Source: body.source }),
    ...(body.message && { Description: body.message }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateLeadRequest;

    // Validate required fields
    if (!body.lastName?.trim()) {
      throw new AppError('lastName is required for Zoho leads', 400);
    }

    const accessToken = await getZohoAccessToken();
    const apiUrl = process.env.ZOHO_API_URL;

    if (!apiUrl) {
      throw new AppError('ZOHO_API_URL is missing', 500);
    }

    const payload = buildLeadPayload(body);
    const duplicateCheckFields = ['Email'];
    if (payload.Phone) duplicateCheckFields.push('Phone');

    // Push to Zoho CRM using UPSERT logic
    const zohoResponse = await fetch(`${apiUrl}/crm/v3/Leads/upsert`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [payload],
        duplicate_check_fields: duplicateCheckFields,
      }),
    });

    if (!zohoResponse.ok) {
      throw new AppError(`Zoho API error: ${zohoResponse.status}`, 502);
    }

    const zohoData = (await zohoResponse.json()) as ZohoCRMResponse;
    const record = zohoData.data?.[0];

    if (record?.status === 'error') {
      throw new AppError(`Zoho rejected lead: ${record.message}`, 422);
    }

    return NextResponse.json(
      successResponse('Lead successfully synced to Zoho CRM', {
        zohoRecordId: record?.details?.id ?? null,
        status: record?.status ?? 'unknown',
      }),
      { status: 200 },
    );
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
