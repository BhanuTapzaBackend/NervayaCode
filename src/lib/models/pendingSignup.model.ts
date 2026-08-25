import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IPendingSignup extends Document {
  phone: string;
  name: string;
  role?: string;
  expiresAt: Date;
}

const pendingSignupSchema = new Schema<IPendingSignup>({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.PendingSignup;
}

const PendingSignup: Model<IPendingSignup> =
  mongoose.models.PendingSignup || mongoose.model<IPendingSignup>('PendingSignup', pendingSignupSchema);

export default PendingSignup;
