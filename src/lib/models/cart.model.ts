import mongoose, { Schema, Document, Model, Types } from 'mongoose';

import { type ItemType } from '@/lib/constants/enums';

export interface ICartItem {
  itemType: ItemType;
  itemId: Types.ObjectId | string;
  name?: string;
  image?: string;
  quantity: number;
  price: number;
  metadata?: Record<string, unknown>;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    itemType: {
      type: String,
      enum: ['Supplement', 'DriftOff', 'Therapy'],
      required: [true, 'Item Type is required'],
      default: 'Supplement',
    },
    itemId: {
      type: Schema.Types.Mixed,
      required: [true, 'Item ID is required'],
    },
    name: {
      type: String,
    },
    image: {
      type: String,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount must be non-negative'],
    },
  },
  {
    timestamps: true,
  },
);

cartSchema.pre('save', function () {
  this.totalAmount = this.items.reduce((total, item) => total + item.price * item.quantity, 0);
});

// Force Mongoose to use the updated schema in development
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Cart;
}

const Cart: Model<ICart> = mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);

export default Cart;
