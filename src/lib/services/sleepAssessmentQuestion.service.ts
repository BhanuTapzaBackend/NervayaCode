import SleepAssessmentQuestion, { ISleepAssessmentQuestion } from '@/lib/models/sleepAssessmentQuestion.model';
import SleepAssessmentResponse from '@/lib/models/sleepAssessmentResponse.model';
import connectDB from '@/lib/db/mongodb';
import { NotFoundError, ValidationError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';
import type { CreateQuestionInput, UpdateQuestionInput } from '@/types/sleepAssessment.types';

const OPTION_BASED_TYPES = ['single_choice', 'multiple_choice', 'scale'] as const;

export async function getAllActiveQuestions(): Promise<ISleepAssessmentQuestion[]> {
  await connectDB();

  try {
    const questions = await SleepAssessmentQuestion.find({ isActive: true }).sort({ order: 1 }).lean();

    return questions as ISleepAssessmentQuestion[];
  } catch (error) {
    throw error;
  }
}

export async function getActiveOptionBasedQuestions(): Promise<ISleepAssessmentQuestion[]> {
  await connectDB();

  try {
    const questions = await SleepAssessmentQuestion.find({
      isActive: true,
      questionType: { $in: OPTION_BASED_TYPES },
      'options.0': { $exists: true },
    })
      .sort({ order: 1 })
      .lean();

    return questions as ISleepAssessmentQuestion[];
  } catch (error) {
    throw error;
  }
}

export async function getAllQuestions(): Promise<ISleepAssessmentQuestion[]> {
  await connectDB();

  try {
    const questions = await SleepAssessmentQuestion.find().sort({ order: 1 }).lean();

    return questions as ISleepAssessmentQuestion[];
  } catch (error) {
    throw error;
  }
}

async function findQuestion(identifier: string) {
  if (Types.ObjectId.isValid(identifier)) {
    return await SleepAssessmentQuestion.findById(identifier);
  }

  return await SleepAssessmentQuestion.findOne({ questionId: identifier });
}

export async function getQuestionById(identifier: string): Promise<ISleepAssessmentQuestion> {
  await connectDB();

  try {
    const question = await findQuestion(identifier);

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    return question.toObject() as ISleepAssessmentQuestion;
  } catch (error) {
    throw error;
  }
}

export async function createQuestion(input: CreateQuestionInput): Promise<ISleepAssessmentQuestion> {
  await connectDB();

  try {
    const question = await SleepAssessmentQuestion.create({
      ...input,
      isRequired: input.isRequired ?? true,
      isActive: input.isActive ?? true,
    });

    return question.toObject() as ISleepAssessmentQuestion;
  } catch (error) {
    throw error;
  }
}

// Scoring questions (order 3-11) use 0-indexed option positions for scoring.
// Reordering or removing options after users have answered would corrupt scores.
const SCORING_QUESTION_ORDERS = [3, 4, 5, 6, 7, 8, 9, 10, 11];

export async function updateQuestion(
  identifier: string,
  input: UpdateQuestionInput,
): Promise<ISleepAssessmentQuestion> {
  await connectDB();

  try {
    const query = Types.ObjectId.isValid(identifier) ? { _id: identifier } : { questionId: identifier };
    const existing = await SleepAssessmentQuestion.findOne(query);

    if (!existing) {
      throw new NotFoundError('Question not found');
    }

    // Guard: prevent option changes on scoring questions that have existing responses
    if (input.options && SCORING_QUESTION_ORDERS.includes(existing.order)) {
      const hasResponses = await SleepAssessmentResponse.exists({
        'answers.questionId': existing._id,
      });

      if (hasResponses) {
        const existingValues = existing.options.map((o) => o.value);
        const newValues = input.options.map((o) => o.value);

        // Check if option values were removed or reordered
        const valuesRemoved = existingValues.some((v) => !newValues.includes(v));
        const orderChanged = existingValues.some((v, i) => {
          const newIdx = newValues.indexOf(v);
          return newIdx !== -1 && newIdx !== i;
        });

        if (valuesRemoved || orderChanged) {
          throw new ValidationError(
            'Cannot reorder or remove options on scoring questions (Q3-Q11) that have existing responses. ' +
              'You may only add new options at the end or update option labels.',
          );
        }
      }
    }

    const question = await SleepAssessmentQuestion.findOneAndUpdate(
      query,
      { $set: input },
      { new: true, runValidators: true },
    );

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    return question.toObject() as ISleepAssessmentQuestion;
  } catch (error) {
    throw error;
  }
}

export async function deleteQuestion(identifier: string): Promise<void> {
  await connectDB();

  try {
    const query = Types.ObjectId.isValid(identifier) ? { _id: identifier } : { questionId: identifier };

    const question = await SleepAssessmentQuestion.findOneAndDelete(query);

    if (!question) {
      throw new NotFoundError('Question not found');
    }
  } catch (error) {
    throw error;
  }
}

export async function reorderQuestions(questionOrders: { questionId: string; order: number }[]): Promise<void> {
  await connectDB();

  try {
    const bulkOps = questionOrders.map(({ questionId, order }) => {
      const filter = Types.ObjectId.isValid(questionId) ? { _id: new Types.ObjectId(questionId) } : { questionId };

      return {
        updateOne: {
          filter,
          update: { $set: { order } },
        },
      };
    });

    await SleepAssessmentQuestion.bulkWrite(bulkOps);
  } catch (error) {
    throw error;
  }
}

export async function toggleQuestionActive(identifier: string, isActive: boolean): Promise<ISleepAssessmentQuestion> {
  await connectDB();

  try {
    const query = Types.ObjectId.isValid(identifier) ? { _id: identifier } : { questionId: identifier };

    const question = await SleepAssessmentQuestion.findOneAndUpdate(query, { $set: { isActive } }, { new: true });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    return question.toObject() as ISleepAssessmentQuestion;
  } catch (error) {
    throw error;
  }
}

export async function deleteAllQuestions(): Promise<void> {
  await connectDB();

  try {
    await SleepAssessmentQuestion.deleteMany({});
  } catch (error) {
    throw error;
  }
}
