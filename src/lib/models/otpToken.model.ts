import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IOtpToken extends Document {
  key: string;
  hashedOtp: string;
  purpose: 'login' | 'signup';
  expiresAt: Date;
}

const otpTokenSchema = new Schema<IOtpToken>({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  hashedOtp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['login', 'signup'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.OtpToken;
}

const OtpToken: Model<IOtpToken> = mongoose.models.OtpToken || mongoose.model<IOtpToken>('OtpToken', otpTokenSchema);

export default OtpToken;
