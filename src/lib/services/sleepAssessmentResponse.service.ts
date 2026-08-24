import SleepAssessmentResponse from '@/lib/models/sleepAssessmentResponse.model';
import SleepAssessmentQuestion from '@/lib/models/sleepAssessmentQuestion.model';
import User from '@/lib/models/user.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError, NotFoundError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';
import { buildSleepAssessmentResult } from '@/lib/utils/sleepAssessmentResult.util';
import { validateAndScoreAssessment } from '@/lib/utils/sleepAssessmentValidation.util';
import { normalizePhone } from '@/lib/utils/validation.util';
import type {
  SubmitAssessmentInput,
  SaveAnswerInput,
  IQuestionAnswer,
  ISleepAssessmentResponse,
} from '@/types/sleepAssessment.types';

type PersistedAnswer = {
  questionId: Types.ObjectId | string;
  answer: string | string[];
};

type HydratableAssessment = Omit<ISleepAssessmentResponse, 'answers'> & {
  answers: PersistedAnswer[];
};

type ScoringQuestion = {
  _id: Types.ObjectId | string;
  order: number;
  options: { id: string; label: string; value: string }[];
};

function castHydratableAssessment(value: unknown): HydratableAssessment {
  return value as unknown as HydratableAssessment;
}

function castHydratableAssessments(value: unknown): HydratableAssessment[] {
  return value as unknown as HydratableAssessment[];
}

function normalizeQuestionId(questionId: unknown): string {
  if (typeof questionId === 'string') return questionId;
  if (questionId && typeof questionId === 'object' && 'toString' in questionId) {
    return String(questionId);
  }
  return '';
}

function normalizeAnswers(answers: PersistedAnswer[] = []): IQuestionAnswer[] {
  return answers
    .map((answer) => ({
      questionId: normalizeQuestionId(answer.questionId),
      answer: answer.answer,
    }))
    .filter((answer) => answer.questionId);
}

async function fetchQuestionsForScoring(questionIds: string[]): Promise<ScoringQuestion[]> {
  const validIds = Array.from(new Set(questionIds.filter((questionId) => Types.ObjectId.isValid(questionId))));
  if (validIds.length === 0) {
    return [];
  }

  const questions = await SleepAssessmentQuestion.find({
    _id: { $in: validIds.map((questionId) => new Types.ObjectId(questionId)) },
  })
    .select('_id order options')
    .lean();

  return questions as ScoringQuestion[];
}

async function buildResultFromAnswers(answers: PersistedAnswer[]): Promise<ISleepAssessmentResponse['result']> {
  const normalizedAnswers = normalizeAnswers(answers);
  if (normalizedAnswers.length === 0) {
    return null;
  }

  const questions = await fetchQuestionsForScoring(normalizedAnswers.map((answer) => answer.questionId));
  if (questions.length === 0) {
    return null;
  }

  return buildSleepAssessmentResult({
    questions: questions.map((question) => ({
      _id: normalizeQuestionId(question._id),
      order: question.order,
      options: question.options ?? [],
    })),
    answers: normalizedAnswers,
  });
}

async function hydrateAssessment(assessment: HydratableAssessment | null): Promise<ISleepAssessmentResponse | null> {
  if (!assessment) {
    return null;
  }

  const [hydratedAssessment] = await hydrateAssessments([assessment]);
  return hydratedAssessment ?? null;
}

async function hydrateAssessments(assessments: HydratableAssessment[]): Promise<ISleepAssessmentResponse[]> {
  if (assessments.length === 0) {
    return [];
  }

  const questionIdsNeedingResult = new Set<string>();

  for (const assessment of assessments) {
    if (!assessment.completedAt || assessment.result) {
      continue;
    }

    for (const answer of assessment.answers ?? []) {
      const questionId = normalizeQuestionId(answer.questionId);
      if (questionId) {
        questionIdsNeedingResult.add(questionId);
      }
    }
  }

  const questions = await fetchQuestionsForScoring(Array.from(questionIdsNeedingResult));
  const questionMap = new Map(questions.map((question) => [normalizeQuestionId(question._id), question]));

  return assessments.map((assessment) => {
    const normalized = normalizeAnswers(assessment.answers);
    const computedQuestions = normalized
      .map((answer) => questionMap.get(answer.questionId))
      .filter((question): question is ScoringQuestion => question != null);

    const result =
      assessment.result ??
      (assessment.completedAt && computedQuestions.length > 0
        ? buildSleepAssessmentResult({
            questions: computedQuestions.map((question) => ({
              _id: normalizeQuestionId(question._id),
              order: question.order,
              options: question.options ?? [],
            })),
            answers: normalized,
          })
        : null);

    return {
      ...assessment,
      answers: normalized,
      result,
    };
  });
}

async function hasCompletedAssessment(userId: string | Types.ObjectId): Promise<boolean> {
  const normalizedUserId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  const assessment = await SleepAssessmentResponse.exists({
    userId: normalizedUserId,
    completedAt: { $ne: null },
  });

  return assessment != null;
}

async function findLatestCompletedAssessment(userId: string | Types.ObjectId): Promise<HydratableAssessment | null> {
  const normalizedUserId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  const assessment = await SleepAssessmentResponse.findOne({
    userId: normalizedUserId,
    completedAt: { $ne: null },
  })
    .sort({ completedAt: -1, createdAt: -1 })
    .lean();

  return assessment ? castHydratableAssessment(assessment) : null;
}

async function assertAssessmentNotCompleted(userId: string | Types.ObjectId): Promise<void> {
  if (await hasCompletedAssessment(userId)) {
    throw new ValidationError('Sleep assessment has already been completed.');
  }
}

export async function submitAssessment(
  userId: string,
  input: SubmitAssessmentInput,
): Promise<ISleepAssessmentResponse> {
  await connectDB();

  if (!Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid User ID');
  }

  await assertAssessmentNotCompleted(userId);

  const { mongooseAnswers, result } = await validateAndScoreAssessment(input.answers);

  const response = await SleepAssessmentResponse.create({
    userId: new Types.ObjectId(userId),
    answers: mongooseAnswers,
    result,
    completedAt: new Date(),
  });

  return (await hydrateAssessment(castHydratableAssessment(response.toObject()))) as ISleepAssessmentResponse;
}

export async function getInProgressAssessment(userId: string): Promise<ISleepAssessmentResponse | null> {
  await connectDB();

  if (!Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid User ID');
  }

  if (await hasCompletedAssessment(userId)) {
    return null;
  }

  const assessment = await SleepAssessmentResponse.findOne({
    userId: new Types.ObjectId(userId),
    completedAt: null,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return await hydrateAssessment(assessment ? castHydratableAssessment(assessment) : null);
}

function validateSingleAnswer(
  question: { questionType: string; questionText: string; isRequired: boolean; options: { value: string }[] },
  answer: string | string[],
): void {
  if (question.isRequired && (answer === undefined || answer === null || answer === '')) {
    throw new ValidationError(`Answer is required for: ${question.questionText}`);
  }
  if (!answer) return;

  const optionBasedTypes = ['single_choice', 'multiple_choice', 'scale'];
  if (question.questionType === 'text' || !optionBasedTypes.includes(question.questionType)) {
    throw new ValidationError('Only option-based questions are accepted. Unsupported question type.');
  }

  if (question.questionType === 'single_choice' || question.questionType === 'scale') {
    if (typeof answer !== 'string') {
      throw new ValidationError(`Single choice answer must be a string for: ${question.questionText}`);
    }
    const validOption = question.options.some((opt) => opt.value === answer);
    if (!validOption) {
      throw new ValidationError(`Invalid option selected for: ${question.questionText}`);
    }
  }

  if (question.questionType === 'multiple_choice') {
    if (!Array.isArray(answer)) {
      throw new ValidationError(`Multiple choice answer must be an array for: ${question.questionText}`);
    }
    for (const selectedValue of answer) {
      const validOption = question.options.some((opt) => opt.value === selectedValue);
      if (!validOption) {
        throw new ValidationError(`Invalid option selected for: ${question.questionText}`);
      }
    }
  }
}

export async function saveAnswer(userId: string, input: SaveAnswerInput): Promise<ISleepAssessmentResponse> {
  await connectDB();

  if (!Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid User ID');
  }
  if (!Types.ObjectId.isValid(input.questionId)) {
    throw new ValidationError('Invalid Question ID');
  }

  const question = await SleepAssessmentQuestion.findOne({
    _id: input.questionId,
    isActive: true,
  });

  if (!question) {
    throw new ValidationError(`Invalid question ID: ${input.questionId}`);
  }

  await assertAssessmentNotCompleted(userId);

  validateSingleAnswer(
    {
      questionType: question.questionType,
      questionText: question.questionText,
      isRequired: question.isRequired,
      options: question.options,
    },
    input.answer,
  );

  let assessment = await SleepAssessmentResponse.findOne({
    userId: new Types.ObjectId(userId),
    completedAt: null,
  }).sort({ updatedAt: -1 });

  if (!assessment) {
    assessment = await SleepAssessmentResponse.create({
      userId: new Types.ObjectId(userId),
      answers: [],
      completedAt: null,
    });
  }

  const answers = [...(assessment.answers || [])];
  const existingIndex = answers.findIndex(
    (a) => (typeof a.questionId === 'object' ? a.questionId.toString() : a.questionId) === input.questionId,
  );

  const newAnswerEntry = {
    questionId: new Types.ObjectId(input.questionId),
    answer: input.answer,
  };

  if (existingIndex >= 0) {
    answers[existingIndex] = newAnswerEntry;
  } else {
    answers.push(newAnswerEntry);
  }

  assessment.answers = answers;
  await assessment.save();

  return (await hydrateAssessment(castHydratableAssessment(assessment.toObject()))) as ISleepAssessmentResponse;
}

export async function completeAssessment(userId: string): Promise<ISleepAssessmentResponse> {
  await connectDB();

  if (!Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid User ID');
  }

  // Atomic: find an in-progress assessment and mark it completed in one operation
  // This prevents race conditions where two requests both pass the check
  const assessment = await SleepAssessmentResponse.findOneAndUpdate(
    {
      userId: new Types.ObjectId(userId),
      completedAt: null,
      'answers.0': { $exists: true }, // Must have at least one answer
    },
    { $set: { completedAt: new Date() } },
    { new: true, sort: { updatedAt: -1 } },
  );

  if (!assessment) {
    // Distinguish between "already completed" and "no assessment found"
    const hasCompleted = await hasCompletedAssessment(userId);
    if (hasCompleted) {
      throw new ValidationError('Sleep assessment has already been completed.');
    }
    throw new NotFoundError('No in-progress assessment with answers found for this user');
  }

  // Build result after atomic completion
  assessment.result = await buildResultFromAnswers(assessment.answers as PersistedAnswer[]);
  await assessment.save();

  return (await hydrateAssessment(castHydratableAssessment(assessment.toObject()))) as ISleepAssessmentResponse;
}

export async function getUserAssessments(userId: string): Promise<ISleepAssessmentResponse[]> {
  await connectDB();

  if (!Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid User ID');
  }

  const assessments = await SleepAssessmentResponse.find({ userId }).sort({ createdAt: -1 }).lean();

  return await hydrateAssessments(castHydratableAssessments(assessments));
}

export async function getLatestUserAssessment(userId: string): Promise<ISleepAssessmentResponse | null> {
  await connectDB();

  if (!Types.ObjectId.isValid(userId)) {
    throw new ValidationError('Invalid User ID');
  }

  const assessment = await findLatestCompletedAssessment(userId);

  return await hydrateAssessment(assessment);
}

export async function getAssessmentById(assessmentId: string, ownerUserId?: string): Promise<ISleepAssessmentResponse> {
  await connectDB();

  if (!Types.ObjectId.isValid(assessmentId)) {
    throw new ValidationError('Invalid Assessment ID');
  }

  const filter: Record<string, unknown> = { _id: new Types.ObjectId(assessmentId) };
  if (ownerUserId) {
    if (!Types.ObjectId.isValid(ownerUserId)) {
      throw new ValidationError('Invalid User ID');
    }
    filter.userId = new Types.ObjectId(ownerUserId);
  }

  const assessment = await SleepAssessmentResponse.findOne(filter).lean();

  if (!assessment) {
    throw new NotFoundError('Assessment not found');
  }

  return (await hydrateAssessment(castHydratableAssessment(assessment))) as ISleepAssessmentResponse;
}

export async function getAllAssessments(): Promise<ISleepAssessmentResponse[]> {
  await connectDB();

  const assessments = await SleepAssessmentResponse.find()
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .lean();

  return await hydrateAssessments(castHydratableAssessments(assessments));
}

export async function deleteAssessment(assessmentId: string): Promise<void> {
  await connectDB();

  if (!Types.ObjectId.isValid(assessmentId)) {
    throw new ValidationError('Invalid Assessment ID');
  }

  const assessment = await SleepAssessmentResponse.findByIdAndDelete(assessmentId);

  if (!assessment) {
    throw new NotFoundError('Assessment not found');
  }
}

/**
 * Admin utility — deletes every SleepAssessmentResponse document for the user
 * with the given phone number. After this, the user can retake the assessment from
 * scratch. Returns how many docs were removed so the caller can show feedback.
 */
export async function resetUserAssessmentsByPhone(
  phone: string,
): Promise<{ deletedCount: number; userId: string; userPhone: string }> {
  await connectDB();

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    throw new ValidationError('Phone number is required');
  }

  const normalizedPhone = normalizePhone(phone) || phone.trim();
  const user = await User.findOne({ phone: normalizedPhone }).lean<{ _id: Types.ObjectId; phone: string }>();

  if (!user) {
    throw new NotFoundError(`No user found with phone "${normalizedPhone}"`);
  }

  const result = await SleepAssessmentResponse.deleteMany({ userId: user._id });

  return {
    deletedCount: result.deletedCount ?? 0,
    userId: user._id.toString(),
    userPhone: user.phone,
  };
}
