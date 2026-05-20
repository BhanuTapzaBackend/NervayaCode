import { NextRequest, NextResponse } from 'next/server';
import { assignVideo } from '@/lib/services/driftOffResponse.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { videoUrl } = body as { videoUrl: string };

    if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
      return NextResponse.json(errorResponse('videoUrl is required', null, 400), { status: 400 });
    }

    const trimmedUrl = videoUrl.trim();
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      return NextResponse.json(errorResponse('videoUrl must be a valid HTTP or HTTPS URL', null, 400), { status: 400 });
    }

    const updated = await assignVideo(id, trimmedUrl);
    return NextResponse.json(successResponse('Video assigned successfully', updated));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
