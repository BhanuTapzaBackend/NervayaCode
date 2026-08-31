import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  /**
   * Stored as `Mixed`, so typed `unknown` here rather than the recursive
   * `ConfigValue`. Passing a recursive type through Mongoose's `Model<>`
   * generics blows the instantiation-depth limit (TS2589). `configService` is
   * the boundary that owns the value's shape.
   */
  value: unknown;
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

// Annotated explicitly, like every other model here.
const SystemConfig: Model<ISystemConfig> =
  (mongoose.models.SystemConfig as Model<ISystemConfig>) ||
  mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

export default SystemConfig;
