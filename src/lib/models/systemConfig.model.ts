import mongoose, { Schema, Document } from 'mongoose';
import type { ConfigValue } from '@/types/systemConfig.types';

export interface ISystemConfig extends Document {
  key: string;
  value: ConfigValue;
  description?: string;
  isPublic: boolean;
  updatedBy?: mongoose.Types.ObjectId;
}

const SystemConfigSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    isPublic: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.SystemConfig;
}

export default mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
