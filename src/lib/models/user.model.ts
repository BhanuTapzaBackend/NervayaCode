import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  email: string;
  password: string;
  name: string;
  role: Role;
  /** Direct mobile number on the user profile. Populated when user provides it. */
  phone?: string;
  /** Set when role is THERAPIST: links to the Therapist profile for this user. */
  therapistId?: mongoose.Types.ObjectId;
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
  addresses: IAddress[];
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
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
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      required: false,
    },
    emailVerified: {
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

userSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
