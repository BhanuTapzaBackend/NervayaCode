import { NextRequest, NextResponse } from 'next/server';
import { ZohoLeadPayload, CreateLeadRequest } from '@/lib/zoho/types';
import { pushLeadToZoho } from '@/lib/zoho/zoho-crm.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError, AppError } from '@/lib/utils/error.util';
import { checkZohoLeadRateLimit } from '@/lib/utils/rate-limit.util';
import { getClientIp } from '@/lib/utils/request.util';

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
    // Public endpoint: the signup form pushes a lead before an account exists,
    // so there is no session to authenticate. Cap per IP so it cannot be used
    // to flood the CRM.
    if (!(await checkZohoLeadRateLimit(getClientIp(request)))) {
      return NextResponse.json(errorResponse('Too many lead submissions. Please try again later.', null, 429), {
        status: 429,
      });
    }

    const body = (await request.json()) as CreateLeadRequest;

    if (!body.lastName?.trim()) {
      throw new AppError('lastName is required for Zoho leads', 400);
    }

    // Zoho deduplicates on identifiers; with neither there is nothing to match
    // against and every submission would create a fresh duplicate.
    if (!body.email?.trim() && !body.phone?.trim()) {
      throw new AppError('Either email or phone is required for Zoho leads', 400);
    }

    // Shares pushLeadToZoho with the server-side touchpoints so both paths use
    // the same base URL handling and the same duplicate_check_fields rule.
    await pushLeadToZoho(buildLeadPayload(body));

    return NextResponse.json(successResponse('Lead successfully synced to Zoho CRM', { status: 'success' }), {
      status: 200,
    });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
