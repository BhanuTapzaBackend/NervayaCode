import mongoose, { Schema, Model, Document } from 'mongoose';
import { v4 } from 'uuid';

export interface IQuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface ISleepAssessmentQuestion extends Document {
  questionId: string;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'text' | 'scale';
  options: IQuestionOption[];
  order: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionOptionSchema = new Schema<IQuestionOption>(
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

const sleepAssessmentQuestionSchema = new Schema<ISleepAssessmentQuestion>(
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
      type: [questionOptionSchema],
      default: [],
      validate: {
        validator: function (this: unknown, options: IQuestionOption[]) {
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

sleepAssessmentQuestionSchema.index({ order: 1, isActive: 1 });

const SleepAssessmentQuestion: Model<ISleepAssessmentQuestion> =
  mongoose.models.SleepAssessmentQuestion ||
  mongoose.model<ISleepAssessmentQuestion>('SleepAssessmentQuestion', sleepAssessmentQuestionSchema);

export default SleepAssessmentQuestion;
