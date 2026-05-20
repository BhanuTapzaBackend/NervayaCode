import { Types } from 'mongoose';
import SleepAssessmentQuestion from '@/lib/models/sleepAssessmentQuestion.model';
import { ValidationError } from '@/lib/utils/error.util';
import { buildSleepAssessmentResult } from '@/lib/utils/sleepAssessmentResult.util';
import type { IQuestionAnswer } from '@/types/sleepAssessment.types';

const OPTION_BASED_TYPES = ['single_choice', 'multiple_choice', 'scale'] as const;

type ScoringQuestion = {
  _id: Types.ObjectId;
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'scale' | 'text';
  isRequired: boolean;
  options: { id: string; label: string; value: string }[];
  order: number;
};

export interface ValidatedAssessmentSubmission {
  mongooseAnswers: { questionId: Types.ObjectId; answer: string | string[] }[];
  result: ReturnType<typeof buildSleepAssessmentResult>;
}

function validateAnswerShape(question: ScoringQuestion, answer: IQuestionAnswer['answer']): void {
  if (question.isRequired && (answer === undefined || answer === null || answer === '')) {
    throw new ValidationError(`Answer is required for: ${question.questionText}`);
  }

  if (question.questionType === 'text' || !OPTION_BASED_TYPES.includes(question.questionType)) {
    throw new ValidationError('Only option-based questions are accepted. Unsupported question type.');
  }

  if (question.questionType === 'single_choice' || question.questionType === 'scale') {
    if (typeof answer !== 'string') {
      throw new ValidationError(`Single choice answer must be a string for: ${question.questionText}`);
    }
    if (answer && !question.options.some((opt) => opt.value === answer)) {
      throw new ValidationError(`Invalid option selected for: ${question.questionText}`);
    }
    return;
  }

  if (!Array.isArray(answer)) {
    throw new ValidationError(`Multiple choice answer must be an array for: ${question.questionText}`);
  }
  for (const value of answer) {
    if (!question.options.some((opt) => opt.value === value)) {
      throw new ValidationError(`Invalid option selected for: ${question.questionText}`);
    }
  }
}

/**
 * Validate raw answers against the active question set and compute the
 * scored result. Shared by the authenticated and guest submission paths.
 */
export async function validateAndScoreAssessment(answers: IQuestionAnswer[]): Promise<ValidatedAssessmentSubmission> {
  if (!answers || answers.length === 0) {
    throw new ValidationError('At least one answer is required');
  }

  const questionIds = answers.map((a) => a.questionId);
  const questions = (await SleepAssessmentQuestion.find({
    _id: { $in: questionIds },
    isActive: true,
  })) as unknown as ScoringQuestion[];
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  const validated: IQuestionAnswer[] = [];
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      throw new ValidationError(`Invalid question ID: ${answer.questionId}`);
    }
    validateAnswerShape(question, answer.answer);
    validated.push({ questionId: answer.questionId, answer: answer.answer });
  }

  const result = buildSleepAssessmentResult({
    questions: questions.map((q) => ({
      _id: q._id.toString(),
      order: q.order,
      options: q.options,
    })),
    answers: validated,
  });

  const mongooseAnswers = validated.map((a) => ({
    questionId: new Types.ObjectId(a.questionId),
    answer: a.answer,
  }));

  return { mongooseAnswers, result };
}
