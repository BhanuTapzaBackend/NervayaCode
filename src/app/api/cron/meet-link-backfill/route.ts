import { NextRequest, NextResponse } from 'next/server';

import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { backfillPendingMeetLinks } from '@/lib/services/meet-link-backfill.service';

// Mongoose needs the Node runtime; force-dynamic so the cron always runs fresh.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron endpoint: finishes bookings whose meeting link failed at checkout.
 *
 * Guarded by CRON_SECRET, the same way `/api/cron/session-reminders` is. Vercel
 * Cron attaches `Authorization: Bearer <CRON_SECRET>` automatically.
 *
 * ⚠️ Like the reminder cron, this does nothing until a schedule exists. There is
 * no `vercel.json` in this repo, so it must be added (or an external scheduler
 * pointed here) before `MEETING_PROVIDER=google` goes live — otherwise a
 * transient calendar failure strands a paid session with no link and nothing
 * ever repairs it. Every ~10 minutes is plenty.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json(errorResponse('Unauthorized', null, 401), { status: 401 });
  }

  try {
    const result = await backfillPendingMeetLinks();
    return NextResponse.json(successResponse('Pending meet links processed', result));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
