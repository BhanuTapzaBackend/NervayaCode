import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { sendDueSessionReminders } from '@/lib/services/session-reminder.service';

// Mongoose needs the Node runtime; force-dynamic so the cron always executes fresh.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron endpoint: sends ~1h-before WhatsApp reminders. Triggered by Vercel Cron, which
 * attaches `Authorization: Bearer <CRON_SECRET>` automatically when CRON_SECRET is set.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json(errorResponse('Unauthorized', null, 401), { status: 401 });
  }

  try {
    const result = await sendDueSessionReminders();
    return NextResponse.json(successResponse('Session reminders processed', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
