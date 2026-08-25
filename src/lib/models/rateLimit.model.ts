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

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.RateLimit;
}

const RateLimit: Model<IRateLimit> =
  mongoose.models.RateLimit || mongoose.model<IRateLimit>('RateLimit', rateLimitSchema);

export default RateLimit;
