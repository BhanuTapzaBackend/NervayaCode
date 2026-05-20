import connectDB from '@/lib/db/mongodb';
import Feedback from '@/lib/models/feedback.model';
import User from '@/lib/models/user.model';

interface AdminFeedbackFilters {
  minScore?: number;
  maxScore?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export async function getAllFeedback(page = 1, limit = 10, filters?: AdminFeedbackFilters) {
  await connectDB();

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const skip = (page - 1) * safeLimit;

  const query: Record<string, unknown> = {};

  if (filters?.minScore !== undefined || filters?.maxScore !== undefined) {
    query.score = {};
    if (filters.minScore !== undefined) (query.score as Record<string, unknown>).$gte = filters.minScore;
    if (filters.maxScore !== undefined) (query.score as Record<string, unknown>).$lte = filters.maxScore;
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
    const userIds = matchingUsers.map((u) => u._id.toString());
    query.userId = { $in: userIds };
  }

  const [feedback, total] = await Promise.all([
    Feedback.find(query).populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Feedback.countDocuments(query),
  ]);

  return {
    data: feedback,
    meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
  };
}

export interface UserFeedbackSummary {
  userId: { _id: string; name: string; email: string };
  totalFeedbacks: number;
  avgScore: number;
  latestComment: string;
  latestDate: string;
}

export async function getFeedbackStats() {
  await connectDB();

  const result = await Feedback.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgScore: { $avg: '$score' },
        promoters: { $sum: { $cond: [{ $gte: ['$score', 9] }, 1, 0] } },
        passives: { $sum: { $cond: [{ $and: [{ $gte: ['$score', 7] }, { $lte: ['$score', 8] }] }, 1, 0] } },
        detractors: { $sum: { $cond: [{ $lte: ['$score', 6] }, 1, 0] } },
      },
    },
  ]);

  if (!result.length) {
    return { total: 0, avgScore: 0, promoters: 0, passives: 0, detractors: 0 };
  }

  const { total, avgScore, promoters, passives, detractors } = result[0] as {
    total: number;
    avgScore: number;
    promoters: number;
    passives: number;
    detractors: number;
  };

  return { total, avgScore: Math.round(avgScore * 10) / 10, promoters, passives, detractors };
}

export async function getFeedbackByUser(page = 1, limit = 20, filters?: AdminFeedbackFilters) {
  await connectDB();

  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const matchStage: Record<string, unknown> = {};
  if (filters?.dateFrom || filters?.dateTo) {
    matchStage.createdAt = {};
    if (filters.dateFrom) (matchStage.createdAt as Record<string, unknown>).$gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const d = new Date(filters.dateTo);
      d.setHours(23, 59, 59, 999);
      (matchStage.createdAt as Record<string, unknown>).$lte = d;
    }
  }

  const pipeline = [
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: '$userId',
        totalFeedbacks: { $sum: 1 },
        avgScore: { $avg: '$score' },
        latestComment: { $last: '$comment' },
        latestDate: { $max: '$createdAt' },
      },
    },
    ...(filters?.minScore !== undefined || filters?.maxScore !== undefined
      ? [
          {
            $match: {
              avgScore: {
                ...(filters.minScore !== undefined ? { $gte: filters.minScore } : {}),
                ...(filters.maxScore !== undefined ? { $lte: filters.maxScore } : {}),
              },
            },
          },
        ]
      : []),
    { $sort: { latestDate: -1 as const } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * safeLimit },
          { $limit: safeLimit },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              userId: {
                _id: '$_id',
                name: { $ifNull: ['$userInfo.name', 'Unknown User'] },
                email: { $ifNull: ['$userInfo.email', ''] },
              },
              totalFeedbacks: 1,
              avgScore: { $round: ['$avgScore', 1] },
              latestComment: 1,
              latestDate: 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const result = await Feedback.aggregate(pipeline);
  const data = (result[0]?.data as UserFeedbackSummary[]) ?? [];
  const total: number = (result[0]?.totalCount as { count: number }[])?.[0]?.count ?? 0;

  return {
    data,
    meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
  };
}

export async function getFeedbackForUser(userId: string) {
  await connectDB();

  const feedback = await Feedback.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();

  return feedback;
}
