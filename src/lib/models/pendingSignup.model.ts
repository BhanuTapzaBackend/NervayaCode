import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IPendingSignup extends Document {
  email: string;
  password: string;
  name: string;
  role?: string;
  expiresAt: Date;
}

const pendingSignupSchema = new Schema<IPendingSignup>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
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

const PendingSignup: Model<IPendingSignup> =
  mongoose.models.PendingSignup || mongoose.model<IPendingSignup>('PendingSignup', pendingSignupSchema);

export default PendingSignup;
