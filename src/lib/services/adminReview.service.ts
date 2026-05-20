import connectDB from '@/lib/db/mongodb';
import Review, { IReview } from '@/lib/models/review.model';
import User from '@/lib/models/user.model';
import { ValidationError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';
import { updateSupplementAggregates } from '@/lib/services/review.service';

interface AdminReviewFilters {
  rating?: number;
  isVisible?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  itemType?: string;
  responseId?: string;
}

export async function getAllReviews(page = 1, limit = 10, filters?: AdminReviewFilters) {
  await connectDB();

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const skip = (page - 1) * safeLimit;

  const query: Record<string, unknown> = {};

  if (filters?.rating) {
    query.rating = filters.rating;
  }
  if (filters?.isVisible !== undefined) {
    query.isVisible = filters.isVisible;
  }
  if (filters?.dateFrom || filters?.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const d = new Date(filters.dateTo);
      d.setHours(23, 59, 59, 999);
      (query.createdAt as Record<string, unknown>).$lte = d;
    }
  }
  if (filters?.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    const matchingUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
    })
      .select('_id')
      .lean();
    const userIds = matchingUsers.map((u) => u._id);
    query.userId = { $in: userIds };
  }
  if (filters?.itemType) {
    query.itemType = filters.itemType;
  }
  if (filters?.responseId && Types.ObjectId.isValid(filters.responseId)) {
    query.responseId = new Types.ObjectId(filters.responseId);
  }

  const [reviews, total] = await Promise.all([
    Review.find(query).populate('productId', 'name image').sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Review.countDocuments(query),
  ]);

  return {
    data: reviews,
    meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
  };
}

export async function toggleReviewVisibility(reviewId: string): Promise<IReview> {
  await connectDB();

  if (!Types.ObjectId.isValid(reviewId)) {
    throw new ValidationError('Invalid review ID');
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ValidationError('Review not found');
  }

  review.isVisible = !review.isVisible;
  await review.save();

  if (review.itemType === 'Supplement') {
    await updateSupplementAggregates(review.productId.toString());
  }

  return review;
}
