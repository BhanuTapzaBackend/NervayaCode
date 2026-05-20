import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IFeedback extends Document {
  userId: Types.ObjectId;
  score: number;
  comment: string;
  pageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score must be at least 0'],
      max: [10, 'Score must be at most 10'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment must be under 1000 characters'],
      default: '',
    },
    pageUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

feedbackSchema.index({ createdAt: -1 });

const Feedback: Model<IFeedback> = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', feedbackSchema);

export default Feedback;
