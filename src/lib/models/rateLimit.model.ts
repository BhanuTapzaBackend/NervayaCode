import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IRateLimit extends Document {
  key: string;
  count: number;
  sendCount: number;
  expiresAt: Date;
}

const rateLimitSchema = new Schema<IRateLimit>({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  sendCount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', rateLimitSchema);

export default RateLimit;
