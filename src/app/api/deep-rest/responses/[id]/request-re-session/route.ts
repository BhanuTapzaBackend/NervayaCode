import { NextRequest, NextResponse } from 'next/server';
import { requestReSession } from '@/lib/services/driftOffResponse.service';
import { successResponse, errorResponse } from '@/lib/utils/response.util';
import { handleError } from '@/lib/utils/error.util';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { ROLES } from '@/lib/constants/roles';
import type { IDriftOffAnswer } from '@/types/driftOff.types';

function parseAnswers(raw: unknown): IDriftOffAnswer[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: IDriftOffAnswer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { questionId, answer } = item as { questionId?: unknown; answer?: unknown };
    if (typeof questionId !== 'string' || !questionId.trim()) continue;
    if (typeof answer !== 'string' && !(Array.isArray(answer) && answer.every((a) => typeof a === 'string'))) continue;
    out.push({ questionId, answer: answer as string | string[] });
  }
  return out.length > 0 ? out : undefined;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, [ROLES.CUSTOMER]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const answers = parseAnswers((body as { answers?: unknown })?.answers);

    const updated = await requestReSession(authResult.user.userId, id, answers);

    return NextResponse.json(successResponse('Re-session requested successfully', updated));
  } catch (error) {
    const { message, statusCode, error: errData } = handleError(error);
    return NextResponse.json(errorResponse(message, errData, statusCode), { status: statusCode });
  }
}
