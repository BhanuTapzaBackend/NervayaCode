import DriftOffQuestion, { IDriftOffQuestion } from '@/lib/models/driftOffQuestion.model';
import connectDB from '@/lib/db/mongodb';
import { NotFoundError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';

const OPTION_BASED_TYPES = ['single_choice', 'multiple_choice', 'scale'] as const;

export interface CreateDriftOffQuestionInput {
  questionText: string;
  questionType: 'single_choice' | 'multiple_choice' | 'text' | 'scale';
  options: { id?: string; label: string; value: string }[];
  order: number;
  isRequired?: boolean;
  isActive?: boolean;
}

export type UpdateDriftOffQuestionInput = Partial<CreateDriftOffQuestionInput>;

export async function getAllActiveDriftOffQuestions(): Promise<IDriftOffQuestion[]> {
  await connectDB();
  const questions = await DriftOffQuestion.find({ isActive: true }).sort({ order: 1 }).lean();
  return questions as IDriftOffQuestion[];
}

export async function getActiveOptionBasedDriftOffQuestions(): Promise<IDriftOffQuestion[]> {
  await connectDB();
  const questions = await DriftOffQuestion.find({
    isActive: true,
    questionType: { $in: OPTION_BASED_TYPES },
    'options.0': { $exists: true },
  })
    .sort({ order: 1 })
    .lean();
  return questions as IDriftOffQuestion[];
}

export async function getAllDriftOffQuestions(): Promise<IDriftOffQuestion[]> {
  await connectDB();
  const questions = await DriftOffQuestion.find().sort({ order: 1 }).lean();
  return questions as IDriftOffQuestion[];
}

async function findDriftOffQuestion(identifier: string) {
  if (Types.ObjectId.isValid(identifier)) {
    return await DriftOffQuestion.findById(identifier);
  }
  return await DriftOffQuestion.findOne({ questionId: identifier });
}

export async function getDriftOffQuestionById(identifier: string): Promise<IDriftOffQuestion> {
  await connectDB();
  const question = await findDriftOffQuestion(identifier);
  if (!question) {
    throw new NotFoundError('Deep Rest question not found');
  }
  return question.toObject() as IDriftOffQuestion;
}

export async function createDriftOffQuestion(input: CreateDriftOffQuestionInput): Promise<IDriftOffQuestion> {
  await connectDB();
  const question = await DriftOffQuestion.create({
    ...input,
    isRequired: input.isRequired ?? true,
    isActive: input.isActive ?? true,
  });
  return question.toObject() as IDriftOffQuestion;
}

export async function updateDriftOffQuestion(
  identifier: string,
  input: UpdateDriftOffQuestionInput,
): Promise<IDriftOffQuestion> {
  await connectDB();
  const query = Types.ObjectId.isValid(identifier) ? { _id: identifier } : { questionId: identifier };
  const question = await DriftOffQuestion.findOneAndUpdate(query, { $set: input }, { new: true, runValidators: true });
  if (!question) {
    throw new NotFoundError('Deep Rest question not found');
  }
  return question.toObject() as IDriftOffQuestion;
}

export async function deleteDriftOffQuestion(identifier: string): Promise<void> {
  await connectDB();
  const query = Types.ObjectId.isValid(identifier) ? { _id: identifier } : { questionId: identifier };
  const question = await DriftOffQuestion.findOneAndDelete(query);
  if (!question) {
    throw new NotFoundError('Deep Rest question not found');
  }
}
