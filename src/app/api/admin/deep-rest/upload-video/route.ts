import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, [ROLES.ADMIN]);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const formData = await request.formData();
    const video = formData.get('video') as File;
    const responseId = formData.get('responseId') as string;
    const userId = formData.get('userId') as string;

    if (!responseId || !userId || !/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(responseId)) {
      return NextResponse.json(errorResponse('Valid userId and responseId are required', null, 400), { status: 400 });
    }

    if (!video) {
      return NextResponse.json(errorResponse('Video file is required', null, 400), { status: 400 });
    }
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(video.type)) {
      return NextResponse.json(
        errorResponse('Invalid file type. Only MP4, WebM, and MOV files are allowed', null, 400),
        { status: 400 },
      );
    }
    const maxSize = 100 * 1024 * 1024;
    if (video.size > maxSize) {
      return NextResponse.json(errorResponse('File size must be less than 100MB', null, 400), { status: 400 });
    }
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'videos');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    const timestamp = Date.now();
    const allowedExtensions = ['mp4', 'webm', 'mov'];
    const rawExtension = (video.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileExtension = allowedExtensions.includes(rawExtension) ? rawExtension : 'mp4';
    const fileName = `${userId}_${responseId}_${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    const videoUrl = `/uploads/videos/${fileName}`;

    return NextResponse.json(successResponse('Video uploaded successfully', { videoUrl, fileName }), { status: 201 });
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
