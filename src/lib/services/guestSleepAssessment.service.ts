import type { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import GuestSleepAssessmentResponse, {
  type IGuestSleepAssessmentResponse,
  GUEST_SESSION_TTL_SECONDS,
} from '@/lib/models/guestSleepAssessmentResponse.model';
import SleepAssessmentResponse from '@/lib/models/sleepAssessmentResponse.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { validateAndScoreAssessment } from '@/lib/utils/sleepAssessmentValidation.util';
import { clearGuestSessionCookie, readGuestSessionId } from '@/lib/utils/guestSession.util';
import type { SubmitAssessmentInput } from '@/types/sleepAssessment.types';

export async function submitGuestAssessment(
  guestSessionId: string,
  input: SubmitAssessmentInput,
): Promise<IGuestSleepAssessmentResponse> {
  await connectDB();

  if (!guestSessionId) {
    throw new ValidationError('Guest session is required');
  }

  const { mongooseAnswers, result } = await validateAndScoreAssessment(input.answers);
  const expiresAt = new Date(Date.now() + GUEST_SESSION_TTL_SECONDS * 1000);

  const saved = await GuestSleepAssessmentResponse.findOneAndUpdate(
    { guestSessionId },
    {
      $set: {
        guestSessionId,
        answers: mongooseAnswers,
        result,
        completedAt: new Date(),
        expiresAt,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return saved;
}

export async function getGuestAssessment(guestSessionId: string): Promise<IGuestSleepAssessmentResponse | null> {
  await connectDB();
  if (!guestSessionId) return null;
  return GuestSleepAssessmentResponse.findOne({ guestSessionId }).lean<IGuestSleepAssessmentResponse>();
}

/**
 * Move guest assessments to the authenticated SleepAssessmentResponse collection.
 * If the user already has a completed assessment, the guest record is discarded
 * (the existing "complete only once" rule wins). Idempotent.
 */
export async function claimGuestAssessments(guestSessionId: string, userId: string): Promise<{ claimed: number }> {
  await connectDB();
  if (!guestSessionId || !Types.ObjectId.isValid(userId)) {
    return { claimed: 0 };
  }

  const userObjectId = new Types.ObjectId(userId);

  const userAlreadyHasCompleted = await SleepAssessmentResponse.exists({
    userId: userObjectId,
    completedAt: { $ne: null },
  });

  if (userAlreadyHasCompleted) {
    await GuestSleepAssessmentResponse.deleteMany({ guestSessionId });
    return { claimed: 0 };
  }

  const guestDocs = await GuestSleepAssessmentResponse.find({ guestSessionId }).lean<IGuestSleepAssessmentResponse[]>();
  if (guestDocs.length === 0) {
    return { claimed: 0 };
  }

  let claimed = 0;
  for (const doc of guestDocs) {
    await SleepAssessmentResponse.create({
      userId: userObjectId,
      answers: doc.answers,
      result: doc.result ?? null,
      completedAt: doc.completedAt ?? new Date(),
    });
    claimed += 1;
  }

  await GuestSleepAssessmentResponse.deleteMany({ guestSessionId });
  return { claimed };
}

/**
 * Best-effort orchestrator: link any guest assessment for this browser to the
 * freshly authenticated user. Errors are swallowed so a claim failure can
 * never block signup or login. The cookie is cleared only on success — a
 * transient DB error leaves the cookie intact so the next login can retry.
 */
export async function attemptGuestClaim(request: NextRequest, response: NextResponse, userId: string): Promise<void> {
  const guestSessionId = readGuestSessionId(request);
  if (!guestSessionId) return;

  try {
    await claimGuestAssessments(guestSessionId, userId);
    clearGuestSessionCookie(response);
  } catch {
    // Intentional swallow — leave cookie intact so a later login can retry.
  }
}
