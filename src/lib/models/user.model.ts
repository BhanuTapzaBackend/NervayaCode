import mongoose, { Schema, Document, Model } from 'mongoose';

import { ROLES, Role } from '../constants/roles';
import { AUTH_PROVIDER_VALUES, type AuthProvider } from '../constants/enums';

export interface IAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  label: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
  _id?: string;
}

export interface IUser extends Document {
  /**
   * WhatsApp number in E.164 (e.g. +919876543210). OPTIONAL: users may sign up
   * with Google and never provide one. Collected later, with OTP verification,
   * only where it is genuinely needed (booking a session, placing an order).
   */
  phone?: string | null;
  /** Optional — used for receipts/CRM, and as the Google sign-in identity. */
  email?: string | null;
  name: string;
  role: Role;
  /** Google `sub` claim. Stable per Google account; set once a user links Google. */
  googleId?: string | null;
  /** Every method this user can authenticate with. See AUTH_PROVIDERS. */
  authProviders: AuthProvider[];
  /** Google profile picture, when they signed in with Google. */
  avatarUrl?: string;
  /**
   * Set when role is THERAPIST: links to the Therapist profile for this user.
   * Explicitly nullable — the schema defaults it to null, and role resolution
   * clears it when a therapist profile is renamed or removed.
   */
  therapistId?: mongoose.Types.ObjectId | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses: IAddress[];
}

/**
 * Empty strings are the enemy of every partial unique index below: '' is a
 * string, so `{$type: 'string'}` alone would index it and two users who both
 * cleared a field would collide. Normalise to null on the way in so the DB
 * never sees '' in the first place.
 */
function emptyToNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

const userSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      trim: true,
      default: null,
      set: emptyToNull,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
      set: emptyToNull,
      match: [/^\S{1,64}@\S{1,255}\.\S{1,63}$/, 'Please enter a valid email'],
    },
    googleId: {
      type: String,
      trim: true,
      default: null,
      set: emptyToNull,
    },
    authProviders: {
      type: [String],
      enum: AUTH_PROVIDER_VALUES,
      default: [],
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      required: true,
    },
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: 'Therapist',
      default: null,
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    addresses: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: 'India' },
        label: {
          type: String,
          enum: ['Home', 'Work', 'Other'],
          default: 'Home',
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// All three identifiers are optional, so uniqueness is enforced only when the
// field actually holds a value.
//
// The `$gt: ''` half matters: `$type: 'string'` alone still matches the empty
// string, so two users who both cleared their email would collide on E11000.
// The `emptyToNull` setters above are belt; this is braces.
//
// Mongoose cannot retrofit these onto a collection holding the old non-partial
// `phone_1` — a same-name/different-options createIndex fails on an event
// nobody listens to, so it fails SILENTLY and the stale index survives. Run
// `npx tsx --env-file=.env scripts/fix-user-identity-indexes.ts` before
// deploying this schema.
const presentString = { $type: 'string' as const, $gt: '' };

userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: presentString }, name: 'phone_1' });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: presentString }, name: 'email_1' });
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: presentString }, name: 'googleId_1' },
);

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
