import Supplement, { ISupplement } from '@/lib/models/supplement.model';
import connectDB from '@/lib/db/mongodb';
import { ValidationError } from '@/lib/utils/error.util';
import { Types } from 'mongoose';

export async function createSupplement(data: Partial<ISupplement>) {
  await connectDB();
  if (!data.name || !data.description || data.price === undefined) {
    throw new ValidationError('Name, description, and price are required');
  }

  if (data.price < 0) {
    throw new ValidationError('Price must be non-negative');
  }

  if (data.stock !== undefined && data.stock < 0) {
    throw new ValidationError('Stock must be non-negative');
  }

  const supplement = await Supplement.create(data);
  return supplement;
}

export interface SupplementFilters {
  isActive?: boolean;
  search?: string;
  minStock?: number;
  maxStock?: number;
}

export interface PaginatedSupplementsResult {
  data: ISupplement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllSupplementsPaginated(
  page: number = 1,
  limit: number = 10,
  filters?: SupplementFilters,
): Promise<PaginatedSupplementsResult> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (filters?.isActive !== undefined) {
    filter.isActive = filters.isActive;
  }
  if (filters?.search && filters.search.trim()) {
    filter.$text = { $search: filters.search.trim() };
  }
  if (filters?.minStock !== undefined && filters.minStock !== null) {
    const stockCond = (filter.stock as Record<string, number>) ?? {};
    filter.stock = { ...stockCond, $gte: filters.minStock };
  }
  if (filters?.maxStock !== undefined && filters.maxStock !== null) {
    const stockCond = (filter.stock as Record<string, number>) ?? {};
    filter.stock = { ...stockCond, $lte: filters.maxStock };
  }
  const skip = (Math.max(1, page) - 1) * Math.max(1, Math.min(limit, 100));
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const [data, total] = await Promise.all([
    Supplement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Supplement.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return { data, total, page: Math.max(1, page), limit: safeLimit, totalPages };
}

export async function getAllSupplements(filter: Record<string, unknown> = {}) {
  await connectDB();
  const supplements = await Supplement.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return supplements;
}

export async function getActiveSupplements() {
  await connectDB();
  const supplements = await Supplement.find({ isActive: true })
    .sort({
      createdAt: -1,
    })
    .limit(200)
    .lean();
  return supplements;
}

export async function getSupplementById(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Supplement ID');
  }
  const supplement = await Supplement.findById(id).lean();
  if (!supplement) {
    throw new ValidationError('Supplement not found');
  }
  return supplement;
}

export async function updateSupplement(id: string, data: Partial<ISupplement>) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Supplement ID');
  }

  if (data.price !== undefined && data.price < 0) {
    throw new ValidationError('Price must be non-negative');
  }

  if (data.stock !== undefined && data.stock < 0) {
    throw new ValidationError('Stock must be non-negative');
  }

  const supplement = await Supplement.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!supplement) {
    throw new ValidationError('Supplement not found');
  }
  return supplement;
}

export async function deleteSupplement(id: string) {
  await connectDB();
  if (!Types.ObjectId.isValid(id)) {
    throw new ValidationError('Invalid Supplement ID');
  }
  const supplement = await Supplement.findByIdAndDelete(id);
  if (!supplement) {
    throw new ValidationError('Supplement not found');
  }
  return { message: 'Supplement deleted successfully' };
}
