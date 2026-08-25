import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Atomic named sequences. Used for invoice numbers, which must be gapless and
 * never reused — two orders paid in the same instant must not share one.
 */
export interface ICounter extends Document {
  /** e.g. `invoice:2026-27` — one document per financial year. */
  key: string;
  value: number;
}

const counterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
});

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Counter;
}

const Counter: Model<ICounter> = mongoose.models.Counter || mongoose.model<ICounter>('Counter', counterSchema);

export default Counter;

/**
 * Increments and returns the next value for `key`.
 *
 * `findOneAndUpdate` with `$inc` is a single atomic document operation, so
 * concurrent callers each get a distinct number without a transaction.
 */
export async function nextSequence(key: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return counter.value;
}
