/**
 * Creates the unique index that stops two customers booking the same therapist
 * slot — which has never actually existed.
 *
 *   npx tsx --env-file=.env scripts/fix-session-slot-index.ts --dry-run
 *   npx tsx --env-file=.env scripts/fix-session-slot-index.ts
 *
 * WHY IT WAS MISSING
 * `session.model.ts` declared it with `partialFilterExpression: { status: { $ne:
 * 'cancelled' } }`. MongoDB does not allow `$ne` in a partial index: it
 * normalises to `$not`, which is rejected with CannotCreateIndex (code 67)
 * synchronously, before any build begins. Mongoose reports that on the model's
 * `index` event, which nothing in this app subscribes to — so it failed
 * silently and the constraint was never enforced anywhere. Confirmed absent in
 * production. The E11000 handler in `rescheduleSession` has never fired.
 *
 * The replacement filters on an `$in` of the live statuses, which is permitted.
 *
 * Safe to re-run.
 */
import mongoose from 'mongoose';

import connectDB from '../src/lib/db/mongodb';
import Session from '../src/lib/models/session.model';
import { SESSION_STATUS } from '../src/lib/constants/enums';

const INDEX_NAME = 'therapist_slot_unique';
const LIVE_STATUSES = [SESSION_STATUS.PENDING, SESSION_STATUS.CONFIRMED, SESSION_STATUS.COMPLETED];

interface Conflict {
  _id: { t: mongoose.Types.ObjectId; d: string; s: string };
  n: number;
  ids: mongoose.Types.ObjectId[];
}

/**
 * A unique index cannot be built over existing duplicates. Because the
 * constraint was never enforced, duplicates are genuinely possible here —
 * unlike a normal index migration where they would be impossible by definition.
 */
async function findConflicts(): Promise<Conflict[]> {
  return Session.collection
    .aggregate<Conflict>([
      { $match: { status: { $in: LIVE_STATUSES } } },
      {
        $group: {
          _id: { t: '$therapistId', d: '$date', s: '$startTime' },
          n: { $sum: 1 },
          ids: { $push: '$_id' },
        },
      },
      { $match: { n: { $gt: 1 } } },
      { $sort: { n: -1 } },
    ])
    .toArray();
}

async function migrate(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const conn = await connectDB();
  console.log(`Connected to ${conn.connection.name}${dryRun ? '  (DRY RUN)' : ''}\n`);

  const before = await Session.collection.indexes();
  console.log('Indexes BEFORE:');
  before.forEach((i) => console.log('  ' + JSON.stringify({ name: i.name, key: i.key, unique: i.unique })));

  const conflicts = await findConflicts();
  if (conflicts.length) {
    console.error(`\n❌ ${conflicts.length} slot(s) are already double-booked. Resolve these first:\n`);
    for (const c of conflicts) {
      console.error(`   therapist=${c._id.t}  ${c._id.d} ${c._id.s}  x${c.n}`);
      c.ids.forEach((id) => console.error(`     session ${id.toString()}`));
    }
    console.error('\nCancel or reschedule the extras by hand — which one survives is a');
    console.error('business decision (they are paid bookings), not something to automate.\n');
    await mongoose.connection.close();
    process.exit(1);
  }
  console.log('\n✅ No double-booked slots.\n');

  const existing = before.find((i) => i.name === INDEX_NAME);
  if (existing) {
    console.log('Index already present — nothing to do.');
    await mongoose.connection.close();
    process.exit(0);
  }

  if (dryRun) {
    console.log(`Would CREATE unique ${INDEX_NAME} on { therapistId, date, startTime }`);
    console.log(`  partialFilterExpression: { status: { $in: ${JSON.stringify(LIVE_STATUSES)} } }`);
    await mongoose.connection.close();
    process.exit(0);
  }

  console.log(`Creating unique ${INDEX_NAME}...`);
  await Session.collection.createIndex(
    { therapistId: 1, date: 1, startTime: 1 },
    {
      unique: true,
      name: INDEX_NAME,
      partialFilterExpression: { status: { $in: LIVE_STATUSES } },
    },
  );

  const after = await Session.collection.indexes();
  console.log('\nIndexes AFTER:');
  after.forEach((i) => console.log('  ' + JSON.stringify({ name: i.name, key: i.key, unique: i.unique })));

  await mongoose.connection.close();
  console.log('\n✅ Done. Double-booking is now prevented at the database level.');
  process.exit(0);
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
