import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import SlotHold, { SLOT_HOLD_TTL_MS } from '@/lib/models/slotHold.model';
import Session from '@/lib/models/session.model';
import { SESSION_STATUS } from '@/lib/constants/enums';
import { ValidationError } from '@/lib/utils/error.util';
import { toObjectId } from '@/lib/utils/objectId.util';

export interface SlotRef {
  therapistId: string;
  date: string;
  startTime: string;
}

const SLOT_TAKEN = 'That time slot has just been taken. Please choose another.';

/**
 * Reserves a slot for this user while they pay.
 *
 * Re-holding a slot you already hold extends it rather than failing, so going
 * back and forth in checkout doesn't lock you out of your own slot.
 *
 * Throws when the slot is already booked or held by someone else.
 */
export async function holdSlot(userId: string, slot: SlotRef): Promise<Date> {
  await connectDB();

  const booked = await Session.findOne({
    therapistId: toObjectId(slot.therapistId),
    date: slot.date,
    startTime: slot.startTime,
    status: { $ne: SESSION_STATUS.CANCELLED },
  }).lean();
  if (booked) throw new ValidationError(SLOT_TAKEN);

  const expiresAt = new Date(Date.now() + SLOT_HOLD_TTL_MS);

  try {
    await SlotHold.findOneAndUpdate(
      { therapistId: toObjectId(slot.therapistId), date: slot.date, startTime: slot.startTime },
      { $set: { expiresAt }, $setOnInsert: { userId: toObjectId(userId) } },
      { upsert: true, new: true },
    );
  } catch (error) {
    // Unique index rejected a concurrent insert for the same slot.
    if ((error as { code?: number }).code === 11000) throw new ValidationError(SLOT_TAKEN);
    throw error;
  }

  // The upsert above extends whatever hold exists, including someone else's, so
  // confirm ownership afterwards and surface a clash rather than stealing it.
  const held = await SlotHold.findOne({
    therapistId: toObjectId(slot.therapistId),
    date: slot.date,
    startTime: slot.startTime,
  }).lean();
  if (!held || String(held.userId) !== String(userId)) throw new ValidationError(SLOT_TAKEN);

  return expiresAt;
}

/** True when the slot is held by someone other than `userId` and still live. */
export async function isHeldByAnother(userId: string, slot: SlotRef): Promise<boolean> {
  await connectDB();
  const held = await SlotHold.findOne({
    therapistId: toObjectId(slot.therapistId),
    date: slot.date,
    startTime: slot.startTime,
    expiresAt: { $gt: new Date() },
  }).lean();
  return Boolean(held && String(held.userId) !== String(userId));
}

/**
 * Drops a hold once its session exists (or its checkout was abandoned).
 * Safe to call when no hold is present.
 */
export async function releaseSlot(slot: SlotRef, mongooseSession?: mongoose.ClientSession): Promise<void> {
  await connectDB();
  const query = SlotHold.deleteOne({
    therapistId: toObjectId(slot.therapistId),
    date: slot.date,
    startTime: slot.startTime,
  });
  if (mongooseSession) query.session(mongooseSession);
  await query;
}
