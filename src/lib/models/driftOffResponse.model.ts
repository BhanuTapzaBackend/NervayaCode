import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IDriftOffAnswer {
  questionId: string;
  answer: string | string[];
}

export interface IDriftOffResponse extends Document {
  userId: mongoose.Types.ObjectId;
  driftOffOrderId: mongoose.Types.ObjectId;
  answers: IDriftOffAnswer[];
  completedAt: Date | null;
  assignedVideoUrl?: string;
  assignedAt?: Date;
  reSessionRequestedAt?: Date | null;
  reSessionResolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
}

const driftOffAnswerSchema = new Schema<IDriftOffAnswer>(
  {
    questionId: {
      type: String,
      required: [true, 'Question ID is required'],
    },
    answer: {
      type: Schema.Types.Mixed,
      required: [true, 'Answer is required'],
    },
  },
  { _id: false },
);

const driftOffResponseSchema = new Schema<IDriftOffResponse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    driftOffOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'DriftOffOrder',
      required: [true, 'Deep Rest Order ID is required'],
    },
    answers: { type: [driftOffAnswerSchema], default: [] },
    completedAt: { type: Date, default: null },
    assignedVideoUrl: { type: String },
    assignedAt: { type: Date },
    reSessionRequestedAt: { type: Date, default: null },
    reSessionResolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

driftOffResponseSchema.index({ userId: 1, completedAt: 1 });
driftOffResponseSchema.index({ userId: 1, createdAt: -1 });

const DriftOffResponse: Model<IDriftOffResponse> =
  mongoose.models.DriftOffResponse || mongoose.model<IDriftOffResponse>('DriftOffResponse', driftOffResponseSchema);

export default DriftOffResponse;
