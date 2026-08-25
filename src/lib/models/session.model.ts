import mongoose, { Schema, Model, Document } from 'mongoose';
import { SESSION_STATUS, SESSION_STATUS_VALUES, SessionStatus } from '@/lib/constants/enums';

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

sessionSchema.index(
  { therapistId: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: SESSION_STATUS.CANCELLED } } },
);
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ date: 1, status: 1 });

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);

export default Session;
