import mongoose, { Schema, Document, Model } from 'mongoose';

import { ROLES, Role } from '../constants/roles';

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
  /** Primary identifier: WhatsApp number in E.164 (e.g. +919876543210). */
  phone: string;
  /** Optional — still used for receipts/CRM where the user provides it. */
  email?: string;
  name: string;
  role: Role;
  /** Set when role is THERAPIST: links to the Therapist profile for this user. */
  therapistId?: mongoose.Types.ObjectId;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses: IAddress[];
}

const userSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
      match: [/^\S{1,64}@\S{1,255}\.\S{1,63}$/, 'Please enter a valid email'],
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

// Enforce email uniqueness only when an email is actually present (it is optional).
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
