import connectDB from '@/lib/db/mongodb';
import DriftOffResponse, { IDriftOffResponse as DriftOffResponseDocument } from '@/lib/models/driftOffResponse.model';
import DriftOffOrder from '@/lib/models/driftOffOrder.model';
import { ValidationError, NotFoundError } from '@/lib/utils/error.util';
import { Types, ClientSession } from 'mongoose';
import type {
  IDriftOffResponse as DriftOffResponseDto,
  IDriftOffAnswer,
  SaveDriftOffAnswerInput,
} from '@/types/driftOff.types';
import { toObjectId } from '@/lib/utils/objectId.util';

type PopulatedDriftOffUser = {
  _id: Types.ObjectId;
  name: string;
  email: string;
};

type LeanDriftOffResponse = Omit<DriftOffResponseDto, 'userId' | 'user'> & {
  userId: Types.ObjectId | PopulatedDriftOffUser;
};

export async function createDriftOffResponse(
  userId: string,
  driftOffOrderId: string,
  session: ClientSession | null = null,
): Promise<DriftOffResponseDocument> {
  await connectDB();
  if (!Types.ObjectId.isValid(driftOffOrderId)) {
    throw new ValidationError('Invalid order ID');
  }
  const userObjectId = toObjectId(userId);
  const order = await DriftOffOrder.findOne({
    _id: driftOffOrderId,
    userId: userObjectId,
    paymentStatus: 'paid',
  }).session(session);
  if (!order) {
    throw new ValidationError('No paid Deep Rest order found for this user');
  }
  const existing = await DriftOffResponse.findOne({ userId: userObjectId, driftOffOrderId }).session(session);
  if (existing) return existing;
  const [newResponse] = await DriftOffResponse.create([{ userId: userObjectId, driftOffOrderId, answers: [] }], {
    session,
  });
  return newResponse;
}

export async function saveAnswer(
  userId: string,
  driftOffOrderId: string,
  input: SaveDriftOffAnswerInput,
): Promise<DriftOffResponseDocument> {
  await connectDB();
  let response = await DriftOffResponse.findOne({ userId: toObjectId(userId), driftOffOrderId });
  if (!response) {
    response = (await createDriftOffResponse(userId, driftOffOrderId)) as Awaited<
      ReturnType<typeof DriftOffResponse.findOne>
    >;
  }
  if (!response) throw new Error('Failed to create or find Deep Rest response');
  if (response.completedAt) {
    throw new ValidationError('Cannot modify answers after assessment is completed');
  }
  const idx = response.answers.findIndex((a) => String(a.questionId) === input.questionId);
  if (idx >= 0) {
    response.answers[idx].answer = input.answer;
  } else {
    response.answers.push({ questionId: input.questionId, answer: input.answer });
  }
  return response.save();
}

export async function completeDriftOffResponse(
  userId: string,
  driftOffOrderId: string,
): Promise<DriftOffResponseDocument> {
  await connectDB();
  const response = await DriftOffResponse.findOne({ userId: toObjectId(userId), driftOffOrderId });
  if (!response) {
    throw new NotFoundError('Deep Rest response not found');
  }
  if (response.completedAt) {
    throw new ValidationError('This assessment has already been completed');
  }
  if (response.answers.length === 0) {
    throw new ValidationError('At least one answer is required');
  }
  response.completedAt = new Date();
  return response.save();
}

export async function getDriftOffResponsesByUser(
  userId: string,
  page = 1,
  limit = 10,
): Promise<{
  data: DriftOffResponseDocument[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  await connectDB();

  const userObjectId = toObjectId(userId);

  // Fallback: Ensure all paid orders have a corresponding response
  const paidOrders = await DriftOffOrder.find({ userId: userObjectId, paymentStatus: 'paid' });
  const existingResponses = await DriftOffResponse.find({ userId: userObjectId });
  const existingOrderIds = new Set(existingResponses.map((r) => r.driftOffOrderId.toString()));

  const missing = paidOrders.filter((order) => !existingOrderIds.has(order._id.toString()));
  if (missing.length > 0) {
    await DriftOffResponse.insertMany(
      missing.map((order) => ({ userId: userObjectId, driftOffOrderId: order._id, answers: [] })),
    );
  }

  // Paginated query
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    DriftOffResponse.find({ userId: userObjectId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    DriftOffResponse.countDocuments({ userId: userObjectId }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getLatestDriftOffResponse(userId: string): Promise<DriftOffResponseDocument | null> {
  await connectDB();
  return DriftOffResponse.findOne({ userId: toObjectId(userId), completedAt: { $ne: null } }).sort({ completedAt: -1 });
}

export async function getDriftOffResponseById(responseId: string): Promise<DriftOffResponseDocument> {
  await connectDB();
  if (!Types.ObjectId.isValid(responseId)) {
    throw new ValidationError('Invalid response ID');
  }
  const response = await DriftOffResponse.findById(responseId);
  if (!response) throw new NotFoundError('Deep Rest response not found');
  return response;
}

export async function getAllDriftOffResponses(): Promise<DriftOffResponseDto[]> {
  await connectDB();
  const responses = await DriftOffResponse.find().populate('userId', 'name email').sort({ createdAt: -1 }).lean();

  return (responses as unknown as LeanDriftOffResponse[]).map((response) => {
    const userRef = response.userId;
    const isPopulatedUser = typeof userRef === 'object' && userRef != null && 'name' in userRef && 'email' in userRef;

    return {
      ...response,
      user: isPopulatedUser
        ? {
            ...userRef,
            _id: String(userRef._id),
          }
        : undefined,
      userId: String(isPopulatedUser ? userRef._id : userRef),
    };
  });
}

export async function assignVideo(responseId: string, videoUrl: string): Promise<DriftOffResponseDocument> {
  await connectDB();
  if (!Types.ObjectId.isValid(responseId)) {
    throw new ValidationError('Invalid response ID');
  }
  const response = await DriftOffResponse.findById(responseId);
  if (!response) throw new NotFoundError('Deep Rest response not found');

  if (!response.completedAt) {
    throw new ValidationError('Cannot assign video before questionnaire is completed');
  }

  response.assignedVideoUrl = videoUrl;
  response.assignedAt = new Date();

  if (response.reSessionRequestedAt && !response.reSessionResolvedAt) {
    response.reSessionResolvedAt = new Date();
  }

  return response.save();
}

export async function requestReSession(
  userId: string,
  responseId: string,
  updatedAnswers?: IDriftOffAnswer[],
): Promise<DriftOffResponseDocument> {
  await connectDB();
  if (!Types.ObjectId.isValid(responseId)) {
    throw new ValidationError('Invalid response ID');
  }

  const response = await DriftOffResponse.findOne({ _id: responseId, userId: toObjectId(userId) });
  if (!response) {
    throw new NotFoundError('Deep Rest response not found');
  }

  if (!response.completedAt) {
    throw new ValidationError('Complete the assessment before requesting a re-session');
  }

  if (!response.assignedVideoUrl) {
    throw new ValidationError('A video must be assigned before requesting a re-session');
  }

  if (response.reSessionRequestedAt) {
    throw new ValidationError('You can request a re-session only once for this session');
  }

  if (updatedAnswers && updatedAnswers.length > 0) {
    response.answers = updatedAnswers.map((a) => ({ questionId: a.questionId, answer: a.answer }));
  }

  response.reSessionRequestedAt = new Date();
  response.reSessionResolvedAt = null;
  return response.save();
}
