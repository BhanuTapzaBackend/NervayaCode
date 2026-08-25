/**
 * Stamps the UNPRIORITIZED sentinel onto therapists and blogs created before
 * the display-priority field existed.
 *
 *   npx tsx --env-file=.env scripts/backfill-priority.ts --dry-run
 *   npx tsx --env-file=.env scripts/backfill-priority.ts
 *
 * REQUIRED before the ordering feature behaves correctly. Mongoose `default`
 * only applies to newly created documents, so existing rows have no `priority`
 * field at all — and MongoDB sorts missing values FIRST in ascending order,
 * which would push every un-numbered item above the numbered ones.
 *
 * Safe to re-run: it only touches documents where the field is still absent.
 */
import connectDB from '../src/lib/db/mongodb';
import Therapist from '../src/lib/models/therapist.model';
import Blog from '../src/lib/models/blog.model';
import { UNPRIORITIZED } from '../src/lib/constants/priority.constants';

const MISSING = { priority: { $exists: false } };

/** Narrow shape so both models can share one code path despite differing schemas. */
interface Backfillable {
  countDocuments: (filter: object) => Promise<number>;
  updateMany: (filter: object, update: object) => Promise<{ modifiedCount: number }>;
}

async function stamp(label: string, model: Backfillable, dryRun: boolean): Promise<void> {
  const count = await model.countDocuments(MISSING);

  if (dryRun) {
    console.log(`  ${label}: ${count} document(s) would be updated`);
    return;
  }

  const result = await model.updateMany(MISSING, { $set: { priority: UNPRIORITIZED } });
  console.log(`  ${label}: ${result.modifiedCount} of ${count} document(s) updated`);
}

async function backfill(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const conn = await connectDB();
  console.log(`Connected to ${conn.connection.name}`);
  console.log(`Stamping priority=${UNPRIORITIZED} on documents missing it${dryRun ? '  (DRY RUN)' : ''}\n`);

  await stamp('therapists', Therapist as unknown as Backfillable, dryRun);
  await stamp('blogs', Blog as unknown as Backfillable, dryRun);

  console.log('\nDone.');
  await conn.connection.close();
}

backfill().catch((error) => {
  console.error('Priority backfill failed:', error);
  process.exit(1);
});
