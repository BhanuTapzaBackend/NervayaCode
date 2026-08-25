import mongoose, { Schema, Document, Model } from 'mongoose';

/** How long a slot stays reserved while the customer completes payment. */
export const SLOT_HOLD_TTL_MS = 10 * 60 * 1000;

/**
 * A therapy slot reserved while its buyer is paying.
 *
 * `Session` already carries a unique index on (therapistId, date, startTime) for
 * non-cancelled sessions, so a double-book is impossible once a session exists.
 * This model covers the gap before that: the window between choosing a slot and
 * the payment landing, during which no Session exists yet and nothing else stops
 * a second customer buying the same time.
 */
export interface ISlotHold extends Document {
  therapistId: mongoose.Types.ObjectId;
  date: string;
  startTime: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const slotHoldSchema = new Schema<ISlotHold>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: 'Therapist', required: true },
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'] },
    startTime: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The guarantee: two concurrent checkouts cannot both hold one slot. This is
// what actually prevents the double sale — the TTL below only tidies up.
slotHoldSchema.index({ therapistId: 1, date: 1, startTime: 1 }, { unique: true });

// Mongo removes expired holds, so an abandoned checkout releases its slot.
slotHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.SlotHold;
}

const SlotHold: Model<ISlotHold> = mongoose.models.SlotHold || mongoose.model<ISlotHold>('SlotHold', slotHoldSchema);

export default SlotHold;
