import mongoose, { Schema, Model, Document } from 'mongoose';

export type DriftOffPaymentStatus = 'pending' | 'paid' | 'failed';

export interface IDriftOffOrder extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  paymentStatus: DriftOffPaymentStatus;
  razorpayOrderId?: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const driftOffOrderSchema = new Schema<IDriftOffOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be non-negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      required: true,
    },
    razorpayOrderId: { type: String, index: true },
    paymentId: { type: String },
  },
  { timestamps: true },
);

driftOffOrderSchema.index({ userId: 1, paymentStatus: 1 });

// Force Mongoose to use the updated schema in development. Without this the model
// compiled before a schema change survives hot-reload, and `strict: true` silently
// drops the new field on write — the update succeeds having written nothing.
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.DriftOffOrder;
}

const DriftOffOrder: Model<IDriftOffOrder> =
  mongoose.models.DriftOffOrder || mongoose.model<IDriftOffOrder>('DriftOffOrder', driftOffOrderSchema);

export default DriftOffOrder;
