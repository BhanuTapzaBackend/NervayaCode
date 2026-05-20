import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
  responseId?: Types.ObjectId;
  userDisplayName?: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  itemType: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplement',
      required: [true, 'Product ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    userDisplayName: { type: String, trim: true },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    isVisible: { type: Boolean, default: true },
    itemType: { type: String, enum: ['Supplement', 'DriftOff', 'Therapy'], default: 'Supplement' },
    responseId: {
      type: Schema.Types.ObjectId,
      ref: 'DriftOffResponse',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, isVisible: 1, createdAt: -1 });
reviewSchema.index(
  { userId: 1, productId: 1, itemType: 1 },
  { unique: true, partialFilterExpression: { itemType: { $ne: 'DriftOff' } } },
);
reviewSchema.index({ itemType: 1, isVisible: 1, createdAt: -1 });
reviewSchema.index({ responseId: 1 }, { sparse: true });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);

export default Review;
