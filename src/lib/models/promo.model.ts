import mongoose, { Schema, Document, Model } from 'mongoose';
import { DISCOUNT_TYPE_VALUES, type DiscountType } from '@/lib/constants/enums';

export interface IPromoCode extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiryDate: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isExhausted(): boolean;
  canApply(cartTotal: number): boolean;
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: [true, 'Code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: DISCOUNT_TYPE_VALUES,
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0.01, 'Discount value must be positive'],
    },
    minPurchase: { type: Number, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

promoCodeSchema.methods.isExpired = function (): boolean {
  return new Date() >= this.expiryDate;
};

promoCodeSchema.methods.isExhausted = function (): boolean {
  if (this.usageLimit == null) return false;
  return this.usedCount >= this.usageLimit;
};

promoCodeSchema.methods.canApply = function (cartTotal: number): boolean {
  if (!this.isActive) return false;
  if (this.isExpired()) return false;
  if (this.isExhausted()) return false;
  if (this.minPurchase != null && cartTotal < this.minPurchase) return false;
  return true;
};

const PromoCode: Model<IPromoCode> =
  mongoose.models.PromoCode || mongoose.model<IPromoCode>('PromoCode', promoCodeSchema);

export default PromoCode;
