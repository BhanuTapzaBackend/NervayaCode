import { NextRequest, NextResponse } from 'next/server';
import { uploadMedia } from '@/lib/services/cloudinary.service';
import { errorResponse, successResponse } from '@/lib/utils/response.util';
import { ApiError } from '@/types/error.types';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/enums';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req, [ROLES.ADMIN, ROLES.THERAPIST]);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(errorResponse('No file uploaded', null, 400), {
        status: 400,
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        errorResponse('Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, MOV', null, 400),
        { status: 400 },
      );
    }

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        errorResponse(`File size exceeds maximum limit of ${isVideo ? '25MB' : '5MB'}`, null, 400),
        { status: 400 },
      );
    }

    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov'];
    const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return NextResponse.json(errorResponse('Invalid file extension', null, 400), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadMedia(buffer);

    return NextResponse.json(successResponse('File uploaded successfully', { url }));
  } catch (error) {
    console.error('[Upload API Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json(errorResponse(errorMessage, error as ApiError, 500), { status: 500 });
  }
}
