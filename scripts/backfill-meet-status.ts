/**
 * Stamps `meetStatus` onto sessions that predate the field.
 *
 *   npx tsx --env-file=.env scripts/backfill-meet-status.ts --dry-run
 *   npx tsx --env-file=.env scripts/backfill-meet-status.ts
 *
 * RUN THIS ALONGSIDE the schema change that flips the default to `pending`.
 *
 * Mongoose defaults apply to newly created documents only, so existing rows
 * have no `meetStatus` at all. Once the default is `pending`, those rows would
 * be read as pending by the retry sweep and it would try to re-create calendar
 * events for sessions that already have perfectly good links — or, worse, for
 * sessions that happened months ago.
 *
 * Classification is by what the row actually holds, not by the default:
 *   has a meetLink -> ready
 *   no meetLink, still upcoming -> pending  (the sweep should genuinely retry)
 *   no meetLink, already past    -> failed  (nothing to salvage; don't chase it)
 *
 * Safe to re-run: only touches documents where the field is still absent.
 */
import mongoose from 'mongoose';

import connectDB from '../src/lib/db/mongodb';
import Session from '../src/lib/models/session.model';
import { MEET_STATUS, SESSION_STATUS } from '../src/lib/constants/enums';

/** IST calendar day, matching how Session.date is stored. */
function istDateKey(date: Date): string {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function backfill(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const conn = await connectDB();
  console.log(`Connected to ${conn.connection.name}${dryRun ? '  (DRY RUN)' : ''}\n`);

  const today = istDateKey(new Date());
  const MISSING = { meetStatus: { $exists: false } };

  // Raw collection throughout: a model call would trigger Mongoose's autoIndex
  // build as a side effect, which index migrations should own, not this script.
  const total = await Session.collection.countDocuments(MISSING);
  if (total === 0) {
    console.log('Nothing to backfill — every session already has meetStatus.');
    await mongoose.connection.close();
    process.exit(0);
  }

  const groups = [
    {
      label: 'ready    (has a link)',
      filter: { ...MISSING, meetLink: { $nin: [null, ''] } },
      status: MEET_STATUS.READY,
    },
    {
      label: 'pending  (no link, still upcoming)',
      filter: {
        ...MISSING,
        meetLink: { $in: [null, ''] },
        date: { $gte: today },
        status: { $in: [SESSION_STATUS.PENDING, SESSION_STATUS.CONFIRMED] },
      },
      status: MEET_STATUS.PENDING,
    },
    {
      label: 'failed   (no link, already past or closed)',
      filter: { ...MISSING, meetLink: { $in: [null, ''] } },
      status: MEET_STATUS.FAILED,
    },
  ];

  console.log(`${total} session(s) missing meetStatus:\n`);

  for (const group of groups) {
    const count = await Session.collection.countDocuments(group.filter);
    if (count === 0) {
      console.log(`  ${group.label}: none`);
      continue;
    }
    if (dryRun) {
      console.log(`  ${group.label}: ${count} would be set to '${group.status}'`);
      continue;
    }

    // Order matters: each pass narrows what the next one can still match,
    // because the field stops being absent once written.
    const result = await Session.collection.updateMany(group.filter, {
      $set: { meetStatus: group.status, meetAttempts: 0, meetNextAttemptAt: null },
    });
    console.log(`  ${group.label}: ${result.modifiedCount} set to '${group.status}'`);
  }

  const remaining = await Session.collection.countDocuments(MISSING);
  console.log(`\n${remaining} session(s) still missing meetStatus.`);

  await mongoose.connection.close();
  console.log(dryRun ? '\n✅ Dry run complete. Re-run without --dry-run to apply.' : '\n✅ Done.');
  process.exit(0);
}

backfill().catch((e) => {
  console.error('❌ Backfill failed:', e);
  process.exit(1);
});
