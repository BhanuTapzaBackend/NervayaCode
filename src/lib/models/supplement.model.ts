import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStarDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ISupplement extends Document {
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  ingredients: string[];
  benefits: string[];
  isActive: boolean;
  originalPrice?: number;
  shortDescription?: string;
  suggestedUse?: string;
  images?: string[];
  capsuleCount?: number;
  unitLabel?: string;
  averageRating?: number;
  reviewCount: number;
  starDistribution?: IStarDistribution;
  additionalSections?: { title: string; content: string[] }[];
  shippingAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplementSchema = new Schema<ISupplement>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
    },
    image: {
      type: String,
      default: '',
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock must be non-negative'],
      default: 0,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    originalPrice: { type: Number, min: 0 },
    shortDescription: { type: String, trim: true },
    suggestedUse: { type: String, trim: true },
    images: { type: [String], default: undefined },
    capsuleCount: { type: Number, min: 0 },
    unitLabel: { type: String, trim: true },
    averageRating: { type: Number, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    starDistribution: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    additionalSections: {
      type: [
        {
          title: { type: String, required: true },
          content: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    shippingAddress: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

supplementSchema.index({ isActive: 1, createdAt: -1 });
supplementSchema.index(
  { name: 'text', description: 'text' },
  {
    weights: { name: 10, description: 1 },
    name: 'supplement_text_search',
  },
);

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Supplement;
}

const Supplement: Model<ISupplement> =
  mongoose.models.Supplement || mongoose.model<ISupplement>('Supplement', supplementSchema);

export default Supplement;
