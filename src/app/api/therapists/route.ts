import { NextRequest, NextResponse } from 'next/server';
import { createTherapist, getAllTherapists } from '@/lib/services/therapist.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const filter: Record<string, unknown> = {};

    const language = searchParams.get('language');
    if (language) {
      filter.languages = { $in: [language] };
    }

    const specializations = searchParams.get('specializations');
    if (specializations) {
      filter.specializations = { $all: specializations.split(',') };
    }

    const gender = searchParams.get('gender');
    if (gender) {
      filter.gender = gender;
    }

    const minExperience = searchParams.get('minExperience');
    const maxExperience = searchParams.get('maxExperience');
    if (minExperience || maxExperience) {
      const expFilter: Record<string, number> = {};
      if (minExperience && !Number.isNaN(Number(minExperience))) {
        expFilter.$gte = Number(minExperience);
      }
      if (maxExperience && !Number.isNaN(Number(maxExperience))) {
        expFilter.$lte = Number(maxExperience);
      }
      if (Object.keys(expFilter).length > 0) {
        filter.experience = expFilter;
      }
    }

    const therapists = await getAllTherapists(filter);
    return NextResponse.json(successResponse('Therapists fetched successfully', therapists));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(errorResponse('Invalid request body', null, 400), { status: 400 });
    }

    const therapist = await createTherapist(body);
    return NextResponse.json(successResponse('Therapist created successfully', therapist, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
