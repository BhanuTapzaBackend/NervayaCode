import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/user.model';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await connectDB();
    const user = await User.findById(authResult.user.userId).select('addresses');

    if (!user) {
      return NextResponse.json(errorResponse('User not found', null, 404), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse('Addresses fetched successfully', user.addresses));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER, ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { name, phone, addressLine1, addressLine2, city, state, zipCode, country, label, isDefault } = body;

    if (!name || !phone || !addressLine1 || !city || !state || !zipCode || !country || !label) {
      return NextResponse.json(errorResponse('Missing required fields', null, 400), { status: 400 });
    }

    await connectDB();

    const user = await User.findById(authResult.user.userId);
    if (!user) {
      return NextResponse.json(errorResponse('User not found', null, 404), {
        status: 404,
      });
    }

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      label,
      isDefault: isDefault || false,
    });

    await user.save();

    return NextResponse.json(successResponse('Address saved successfully', user.addresses, 201), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), {
      status: statusCode,
    });
  }
}
