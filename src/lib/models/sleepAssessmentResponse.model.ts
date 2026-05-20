import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IQuestionAnswer {
  questionId: mongoose.Types.ObjectId;
  answer: string | string[];
}

export interface ISleepAssessmentRecommendation {
  key: 'guided_audio' | 'guided_meditation_audio' | 'counselling' | 'supplement';
  title: string;
  description: string;
  buttonText: string;
  href: string;
  priority: 'primary' | 'secondary' | 'none';
}

export interface ISleepAssessmentResultFlags {
  recommendsSupplement: boolean;
  recommendsCounselling: boolean;
  prioritiseGuidedMeditationAudio: boolean;
  hasFrequentSleepOnsetIssue: boolean;
  highOverthinking: boolean;
}

export interface ISleepAssessmentResult {
  severityScore: number;
  severityBand: 'mild' | 'moderate' | 'severe' | 'none';
  severityLabel: string;
  explanation: string;
  reasoning: string[];
  recommendations: ISleepAssessmentRecommendation[];
  intentAnswer: string | string[] | null;
  intentLabel: string | null;
  flags: ISleepAssessmentResultFlags;
}

export interface ISleepAssessmentResponse extends Document {
  userId: mongoose.Types.ObjectId;
  answers: IQuestionAnswer[];
  result?: ISleepAssessmentResult | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const questionAnswerSchema = new Schema<IQuestionAnswer>(
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

const sleepAssessmentRecommendationSchema = new Schema<ISleepAssessmentRecommendation>(
  {
    key: {
      type: String,
      enum: ['guided_audio', 'guided_meditation_audio', 'counselling', 'supplement'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['primary', 'secondary', 'none'],
      required: true,
    },
  },
  { _id: false },
);

const sleepAssessmentResultFlagsSchema = new Schema<ISleepAssessmentResultFlags>(
  {
    recommendsSupplement: {
      type: Boolean,
      required: true,
    },
    recommendsCounselling: {
      type: Boolean,
      required: true,
    },
    prioritiseGuidedMeditationAudio: {
      type: Boolean,
      required: true,
    },
    hasFrequentSleepOnsetIssue: {
      type: Boolean,
      required: true,
    },
    highOverthinking: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false },
);

const sleepAssessmentResultSchema = new Schema<ISleepAssessmentResult>(
  {
    severityScore: {
      type: Number,
      required: true,
    },
    severityBand: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'none'],
      required: true,
    },
    severityLabel: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    reasoning: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [sleepAssessmentRecommendationSchema],
      default: [],
    },
    intentAnswer: {
      type: Schema.Types.Mixed,
      default: null,
    },
    intentLabel: {
      type: String,
      default: null,
    },
    flags: {
      type: sleepAssessmentResultFlagsSchema,
      required: true,
    },
  },
  { _id: false },
);

const sleepAssessmentResponseSchema = new Schema<ISleepAssessmentResponse>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    answers: {
      type: [questionAnswerSchema],
      default: [],
    },
    result: {
      type: sleepAssessmentResultSchema,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

sleepAssessmentResponseSchema.pre('save', function (this: ISleepAssessmentResponse) {
  if (this.completedAt != null && (!this.answers || this.answers.length === 0)) {
    throw new Error('At least one answer is required when completing an assessment');
  }
});

sleepAssessmentResponseSchema.index({ userId: 1, completedAt: 1 });
sleepAssessmentResponseSchema.index({ userId: 1, createdAt: -1 });

const SleepAssessmentResponse: Model<ISleepAssessmentResponse> =
  mongoose.models.SleepAssessmentResponse ||
  mongoose.model<ISleepAssessmentResponse>('SleepAssessmentResponse', sleepAssessmentResponseSchema);

export default SleepAssessmentResponse;
