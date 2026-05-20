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

export default mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
