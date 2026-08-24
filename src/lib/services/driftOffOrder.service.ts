import connectDB from '@/lib/db/mongodb';
import DriftOffOrder, { IDriftOffOrder } from '@/lib/models/driftOffOrder.model';
import { ValidationError, NotFoundError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';
import type { PaginationMeta } from '@/types/pagination.types';
import { toObjectId } from '@/lib/utils/objectId.util';

export async function createDriftOffOrder(userId: string, amount: number): Promise<IDriftOffOrder> {
  await connectDB();
  return DriftOffOrder.create({ userId: toObjectId(userId), amount, paymentStatus: 'pending' });
}

export async function getDriftOffOrderById(orderId: string): Promise<IDriftOffOrder> {
  await connectDB();
  if (!Types.ObjectId.isValid(orderId)) {
    throw new ValidationError('Invalid order ID');
  }
  const order = await DriftOffOrder.findById(orderId).lean();
  if (!order) {
    throw new NotFoundError('Deep Rest order not found');
  }
  return order as IDriftOffOrder;
}

export async function getDriftOffOrdersByUser(
  userId: string,
  page = 1,
  limit = 10,
): Promise<{ data: IDriftOffOrder[]; meta: PaginationMeta }> {
  await connectDB();
  const userObjectId = toObjectId(userId);
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    DriftOffOrder.find({ userId: userObjectId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    DriftOffOrder.countDocuments({ userId: userObjectId }),
  ]);
  return {
    data: data as IDriftOffOrder[],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}
