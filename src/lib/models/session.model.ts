import mongoose, { Schema, Model, Document } from 'mongoose';
import {
  SESSION_STATUS,
  SESSION_STATUS_VALUES,
  SessionStatus,
  MEET_STATUS,
  MEET_STATUS_VALUES,
  type MeetStatusValue,
} from '@/lib/constants/enums';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  therapistId: mongoose.Types.ObjectId;
  /** The order that paid for this session. Absent on legacy sessions. */
  orderId?: mongoose.Types.ObjectId;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  meetLink?: string;
  /** Whether meetLink is real yet. See MEET_STATUS. */
  meetStatus?: MeetStatusValue;
  /** How many times link generation has been attempted, for the retry sweep. */
  meetAttempts?: number;
  /** Earliest time the retry sweep should try again. */
  meetNextAttemptAt?: Date | null;
  googleEventId?: string;
  /** Set once the ~1h-before WhatsApp reminder has been sent (dedupe guard). */
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: 'Therapist',
      required: [true, 'Therapist ID is required'],
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: SESSION_STATUS_VALUES,
      default: SESSION_STATUS.PENDING,
      required: true,
    },
    meetLink: {
      type: String,
      default: '',
    },
    // PENDING until finalizeSessionBooking actually produces a link. Defaulting
    // to READY meant a session created but never finalized (process died, or
    // the persist threw) looked complete forever and no sweep would touch it.
    //
    // Rows predating this field read as `undefined` under `.lean()` — which does
    // NOT apply schema defaults — so treat undefined as ready at the read site
    // and run scripts/backfill-meet-status.ts once.
    meetStatus: {
      type: String,
      enum: MEET_STATUS_VALUES,
      default: MEET_STATUS.PENDING,
    },
    meetAttempts: {
      type: Number,
      default: 0,
    },
    meetNextAttemptAt: {
      type: Date,
      default: null,
    },
    googleEventId: {
      type: String,
      default: '',
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Stops two customers paying for the same therapist slot.
//
// ⚠️ The filter MUST be an `$in` of live statuses, never `$ne: 'cancelled'`.
// MongoDB does not permit `$ne` in a partialFilterExpression — it normalises to
// `$not`, which is rejected with CannotCreateIndex (code 67) synchronously,
// BEFORE any build starts. Mongoose reports that on the model's `index` event,
// which nothing in this app listens to, so the previous `$ne` version failed
// SILENTLY and this index simply never existed in any environment. Verified
// absent in production. Run `scripts/fix-session-slot-index.ts` to create it.
sessionSchema.index(
  { therapistId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    name: 'therapist_slot_unique',
    partialFilterExpression: {
      status: { $in: [SESSION_STATUS.PENDING, SESSION_STATUS.CONFIRMED, SESSION_STATUS.COMPLETED] },
    },
  },
);
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ date: 1, status: 1 });

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Session;
}

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);

export default Session;
