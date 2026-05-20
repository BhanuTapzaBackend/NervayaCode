import { Types } from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import DriftOffOrder from '@/lib/models/driftOffOrder.model';
import Order from '@/lib/models/order.model';
import Cart from '@/lib/models/cart.model';
import Session from '@/lib/models/session.model';
import Review from '@/lib/models/review.model';

interface RawDoc {
  _id: unknown;
  userId: unknown;
  items?: unknown[];
  [key: string]: unknown;
}

interface RawCollection {
  name: string;
  find: (filter: object) => { toArray: () => Promise<RawDoc[]> };
  findOne: (filter: object) => Promise<RawDoc | null>;
  updateOne: (filter: object, update: object) => Promise<unknown>;
  deleteOne: (filter: object) => Promise<unknown>;
}

type ModelLike = { collection: RawCollection };

const SIMPLE_MODELS: ModelLike[] = [
  DriftOffOrder as unknown as ModelLike,
  Order as unknown as ModelLike,
  Session as unknown as ModelLike,
  Review as unknown as ModelLike,
];

async function backfillSimple(model: ModelLike) {
  const collection = model.collection;
  const docs = await collection.find({ userId: { $type: 'string' } }).toArray();

  let converted = 0;
  let skipped = 0;

  for (const doc of docs) {
    const raw = doc.userId;
    if (typeof raw !== 'string' || !Types.ObjectId.isValid(raw)) {
      skipped += 1;
      continue;
    }
    await collection.updateOne({ _id: doc._id }, { $set: { userId: new Types.ObjectId(raw) } });
    converted += 1;
  }

  console.log(`[${collection.name}] converted=${converted} skipped=${skipped}`);
}

async function backfillCarts() {
  const collection = (Cart as unknown as ModelLike).collection;
  const docs = await collection.find({ userId: { $type: 'string' } }).toArray();

  let converted = 0;
  let merged = 0;
  let skipped = 0;

  for (const doc of docs) {
    const raw = doc.userId;
    if (typeof raw !== 'string' || !Types.ObjectId.isValid(raw)) {
      skipped += 1;
      continue;
    }

    const objectId = new Types.ObjectId(raw);
    const existing = await collection.findOne({ userId: objectId });

    if (!existing) {
      await collection.updateOne({ _id: doc._id }, { $set: { userId: objectId } });
      converted += 1;
      continue;
    }

    // Merge string-cart items into the canonical ObjectId cart, then delete the duplicate.
    const legacyItems = Array.isArray(doc.items) ? doc.items : [];
    const canonicalItems = Array.isArray(existing.items) ? existing.items : [];

    if (legacyItems.length > 0) {
      const canonicalKeys = new Set(
        canonicalItems.map((item) => {
          const i = item as { itemId?: unknown; itemType?: unknown };
          return `${String(i.itemId)}_${String(i.itemType)}`;
        }),
      );
      const toAdd = legacyItems.filter((item) => {
        const i = item as { itemId?: unknown; itemType?: unknown };
        return !canonicalKeys.has(`${String(i.itemId)}_${String(i.itemType)}`);
      });
      if (toAdd.length > 0) {
        await collection.updateOne({ _id: existing._id }, { $push: { items: { $each: toAdd } } });
      }
    }

    await collection.deleteOne({ _id: doc._id });
    merged += 1;
  }

  console.log(`[${collection.name}] converted=${converted} merged=${merged} skipped=${skipped}`);
}

async function main() {
  await connectDB();
  console.log('Starting userId String -> ObjectId backfill...');

  for (const model of SIMPLE_MODELS) {
    await backfillSimple(model);
  }
  await backfillCarts();

  console.log('Backfill complete.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
