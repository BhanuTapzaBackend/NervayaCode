import { Types } from 'mongoose';
import { ValidationError } from '@/lib/utils/error.util';

export function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;
  if (!Types.ObjectId.isValid(value)) {
    throw new ValidationError('Invalid ObjectId');
  }
  return new Types.ObjectId(value);
}
