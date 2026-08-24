import Review, { IReview } from '@/lib/models/review.model';
import Supplement, { IStarDistribution } from '@/lib/models/supplement.model';
import DriftOffResponse from '@/lib/models/driftOffResponse.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';
import type { PaginationMeta } from '@/types/pagination.types';
import { toObjectId } from '@/lib/utils/objectId.util';

export async function getByProductId(productId: string, page = 1, limit = 10) {
  await connectDB();
  if (!Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ productId: new Types.ObjectId(productId), isVisible: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId: new Types.ObjectId(productId), isVisible: true }),
  ]);
  return {
    data: reviews,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getByItemType(itemId: string, itemType: string, page = 1, limit = 10) {
  await connectDB();
  if (!Types.ObjectId.isValid(itemId)) {
    throw new ValidationError('Invalid item ID');
  }
  const filter = { productId: new Types.ObjectId(itemId), itemType, isVisible: true };
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
  ]);
  return {
    data: reviews,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function create(
  productId: string,
  userId: string,
  rating: number,
  comment?: string,
  userDisplayName?: string,
  itemType: string = 'Supplement',
) {
  await connectDB();
  if (!Types.ObjectId.isValid(productId)) {
    throw new ValidationError('Invalid product ID');
  }
  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }
  if (itemType === 'Supplement') {
    const supplement = await Supplement.findById(productId);
    if (!supplement) {
      throw new ValidationError('Supplement not found');
    }
  }
  const review = await Review.findOneAndUpdate(
    { productId: new Types.ObjectId(productId), userId: toObjectId(userId), itemType },
    {
      rating,
      comment: comment ?? '',
      userDisplayName: userDisplayName ?? '',
      itemType,
    },
    { new: true, upsert: true, runValidators: true },
  );
  if (itemType === 'Supplement') {
    await updateSupplementAggregates(productId);
  }
  return review;
}

export async function updateSupplementAggregates(productId: string) {
  const [result] = await Review.aggregate([
    { $match: { productId: new Types.ObjectId(productId), isVisible: true } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
      },
    },
  ]);

  if (!result) {
    await Supplement.findByIdAndUpdate(productId, {
      averageRating: undefined,
      reviewCount: 0,
      starDistribution: undefined,
    });
    return;
  }

  const averageRating = Math.round(result.avgRating * 10) / 10;
  const starDistribution: IStarDistribution = {
    1: result.star1,
    2: result.star2,
    3: result.star3,
    4: result.star4,
    5: result.star5,
  };

  await Supplement.findByIdAndUpdate(productId, {
    averageRating,
    reviewCount: result.count,
    starDistribution,
  });
}

export async function createDriftOffReview(
  responseId: string,
  userId: string,
  rating: number,
  comment?: string,
  userDisplayName?: string,
): Promise<IReview> {
  await connectDB();
  if (!Types.ObjectId.isValid(responseId)) {
    throw new ValidationError('Invalid response ID');
  }
  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5');
  }

  const response = await DriftOffResponse.findById(responseId);
  if (!response) {
    throw new ValidationError('Deep Rest session not found');
  }
  if (response.userId.toString() !== userId) {
    throw new ValidationError('You can only review your own sessions');
  }
  if (!response.assignedVideoUrl) {
    throw new ValidationError('You can only review sessions that have a video assigned');
  }

  const responseObjectId = new Types.ObjectId(responseId);
  const existing = await Review.findOne({
    responseId: responseObjectId,
    userId: new Types.ObjectId(userId),
    itemType: 'DriftOff',
  }).lean();
  if (existing) {
    throw new ValidationError('You have already submitted a review for this session');
  }

  const review = await Review.create({
    productId: response.driftOffOrderId,
    userId: new Types.ObjectId(userId),
    responseId: responseObjectId,
    rating,
    comment: comment ?? '',
    userDisplayName: userDisplayName ?? '',
    itemType: 'DriftOff',
    isVisible: false,
  });

  return review;
}

export async function getApprovedDriftOffReviews(
  page = 1,
  limit = 20,
): Promise<{ data: IReview[]; meta: PaginationMeta }> {
  await connectDB();
  const filter = { itemType: 'DriftOff', isVisible: true };
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Review.find(filter)
      .select('rating comment userDisplayName itemType createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);
  return {
    data: data as IReview[],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}
