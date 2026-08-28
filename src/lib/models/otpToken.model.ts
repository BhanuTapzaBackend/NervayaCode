import mongoose, { Schema, Model, Document } from 'mongoose';
import { OTP_PURPOSE_VALUES, type OtpPurpose } from '@/lib/constants/enums';

export interface IOtpToken extends Document {
  key: string;
  hashedOtp: string;
  /**
   * Derived from the shared enum rather than re-declared.
   *
   * This union and the schema `enum` below both said `'login' | 'signup'` while
   * `link_phone` was already in active use — it only survived because `saveOtp`
   * writes with `findOneAndUpdate`, which skips validators. One `.create()` or
   * `runValidators: true` anywhere would have silently killed phone linking.
   */
  purpose: OtpPurpose;
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
    enum: OTP_PURPOSE_VALUES,
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
