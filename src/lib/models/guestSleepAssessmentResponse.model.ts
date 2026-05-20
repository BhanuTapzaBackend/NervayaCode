import mongoose, { Schema, Model, Document } from 'mongoose';
import type { IQuestionAnswer, ISleepAssessmentResult } from './sleepAssessmentResponse.model';

export const GUEST_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface IGuestSleepAssessmentResponse extends Document {
  guestSessionId: string;
  answers: IQuestionAnswer[];
  result?: ISleepAssessmentResult | null;
  completedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const questionAnswerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'SleepAssessmentQuestion',
      required: [true, 'Question ID is required'],
    },
    answer: {
      type: Schema.Types.Mixed,
      required: [true, 'Answer is required'],
    },
  },
  { _id: false },
);

const guestSleepAssessmentResponseSchema = new Schema<IGuestSleepAssessmentResponse>(
  {
    guestSessionId: {
      type: String,
      required: [true, 'Guest session ID is required'],
      index: true,
    },
    answers: {
      type: [questionAnswerSchema],
      default: [],
    },
    result: {
      type: Schema.Types.Mixed,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// TTL index — Mongo auto-deletes documents at the expiresAt timestamp.
guestSleepAssessmentResponseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const GuestSleepAssessmentResponse: Model<IGuestSleepAssessmentResponse> =
  mongoose.models.GuestSleepAssessmentResponse ||
  mongoose.model<IGuestSleepAssessmentResponse>('GuestSleepAssessmentResponse', guestSleepAssessmentResponseSchema);

export default GuestSleepAssessmentResponse;
