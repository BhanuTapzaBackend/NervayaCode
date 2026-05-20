import mongoose, { Schema, Model, Document } from 'mongoose';
import { v4 } from 'uuid';

export interface IDriftOffQuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface IDriftOffQuestion extends Document {
  questionId: string;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'text' | 'scale';
  options: IDriftOffQuestionOption[];
  order: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const driftOffQuestionOptionSchema = new Schema<IDriftOffQuestionOption>(
  {
    id: {
      type: String,
      required: [true, 'Option ID is required'],
    },
    label: {
      type: String,
      required: [true, 'Option label is required'],
      trim: true,
    },
    value: {
      type: String,
      required: [true, 'Option value is required'],
      trim: true,
    },
  },
  { _id: false },
);

const driftOffQuestionSchema = new Schema<IDriftOffQuestion>(
  {
    questionId: {
      type: String,
      required: true,
      unique: true,
      default: () => v4(),
      index: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [500, 'Question text cannot exceed 500 characters'],
    },
    questionType: {
      type: String,
      enum: {
        values: ['single_choice', 'multiple_choice', 'text', 'scale'],
        message: 'Invalid question type',
      },
      required: [true, 'Question type is required'],
    },
    options: {
      type: [driftOffQuestionOptionSchema],
      default: [],
      validate: {
        validator: function (this: unknown, options: IDriftOffQuestionOption[]) {
          const doc = this as Record<string, unknown>;
          if (doc.questionType === 'text') {
            return true;
          }
          return options.length >= 2;
        },
        message: 'Non-text questions must have at least 2 options',
      },
    },
    order: {
      type: Number,
      required: [true, 'Question order is required'],
      min: [1, 'Order must be at least 1'],
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

driftOffQuestionSchema.index({ order: 1, isActive: 1 });

const DriftOffQuestion: Model<IDriftOffQuestion> =
  mongoose.models.DriftOffQuestion || mongoose.model<IDriftOffQuestion>('DriftOffQuestion', driftOffQuestionSchema);

export default DriftOffQuestion;
