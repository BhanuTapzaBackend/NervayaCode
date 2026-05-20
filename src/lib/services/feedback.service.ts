import connectDB from '@/lib/db/mongodb';
import Feedback, { IFeedback } from '@/lib/models/feedback.model';
import { ValidationError } from '@/lib/utils/error.util';

interface CreateFeedbackInput {
  userId: string;
  score: number;
  comment?: string;
  pageUrl?: string;
}

export async function createFeedback(input: CreateFeedbackInput): Promise<IFeedback> {
  await connectDB();

  if (input.score < 0 || input.score > 10 || !Number.isInteger(input.score)) {
    throw new ValidationError('Score must be an integer between 0 and 10');
  }

  if (input.comment && input.comment.length > 1000) {
    throw new ValidationError('Comment must be under 1000 characters');
  }

  const feedback = await Feedback.create({
    userId: input.userId,
    score: input.score,
    comment: input.comment ?? '',
    pageUrl: input.pageUrl ?? '',
  });

  return feedback;
}
