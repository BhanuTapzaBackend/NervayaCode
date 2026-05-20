export type QuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'scale';

export interface IQuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface ISleepAssessmentQuestion {
  _id: string;
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  options: IQuestionOption[];
  order: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestionAnswer {
  questionId: string;
  answer: string | string[];
}

export type SleepAssessmentSeverityBand = 'mild' | 'moderate' | 'severe' | 'none';

export interface SeverityBannerEntry {
  icon: string;
  themeClass: 'bannerSevere' | 'bannerModerate' | 'bannerMild' | 'bannerNone';
  headline: string;
  fallbackText: string;
}

export type SleepAssessmentRecommendationKey =
  | 'guided_audio'
  | 'guided_meditation_audio'
  | 'counselling'
  | 'supplement';

export interface SleepAssessmentRecommendation {
  key: SleepAssessmentRecommendationKey;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  priority: 'primary' | 'secondary' | 'none';
}

export interface SleepAssessmentResultFlags {
  recommendsSupplement: boolean;
  recommendsCounselling: boolean;
  prioritiseGuidedMeditationAudio: boolean;
  hasFrequentSleepOnsetIssue: boolean;
  highOverthinking: boolean;
}

export interface SleepAssessmentResult {
  severityScore: number;
  severityBand: SleepAssessmentSeverityBand;
  severityLabel: string;
  description: string;
  bannerText: string;
  explanation: string;
  reasoning: string[];
  recommendations: SleepAssessmentRecommendation[];
  intentAnswer: string | string[] | null;
  intentLabel: string | null;
  flags: SleepAssessmentResultFlags;
}

export interface ISleepAssessmentResponse {
  _id: string;
  userId: string;
  answers: IQuestionAnswer[];
  result?: SleepAssessmentResult | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuestionInput {
  questionText: string;
  questionType: QuestionType;
  options: IQuestionOption[];
  order: number;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface UpdateQuestionInput {
  questionText?: string;
  questionType?: QuestionType;
  options?: IQuestionOption[];
  order?: number;
  isRequired?: boolean;
  isActive?: boolean;
  category?: string;
}

export interface SubmitAssessmentInput {
  answers: IQuestionAnswer[];
}

export interface SaveAnswerInput {
  questionId: string;
  answer: string | string[];
}
