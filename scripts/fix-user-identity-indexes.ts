/**
 * Repoints the User collection's unique indexes for optional-phone signup.
 *
 *   npx tsx --env-file=.env scripts/fix-user-identity-indexes.ts --dry-run
 *   npx tsx --env-file=.env scripts/fix-user-identity-indexes.ts
 *
 * RUN THIS BEFORE DEPLOYING the schema change that makes `phone` optional.
 *
 * Why it cannot be left to Mongoose: `autoIndex` never DROPS an index, and
 * calling createIndex under an existing name with different options fails with
 * IndexOptionsConflict (code 85) on the model's `index` event — which nothing in
 * this app listens to. It therefore fails SILENTLY: the old non-partial
 * `phone_1` survives, the first phone-less signup succeeds, and the SECOND one
 * dies with E11000 surfaced to the user as "User already exists".
 * `scripts/fix-email-index.ts` exists because this already happened once.
 *
 * The new indexes filter on `{$type: 'string', $gt: ''}` rather than `$type`
 * alone. `''` IS a string, so the old filter still indexed empty values and two
 * users who both cleared a field would collide — the same latent hole, moved.
 *
 * Safe to re-run.
 */
import mongoose from 'mongoose';

import connectDB from '../src/lib/db/mongodb';
import User from '../src/lib/models/user.model';
import { AUTH_PROVIDERS } from '../src/lib/constants/enums';

const PRESENT_STRING = { $type: 'string', $gt: '' } as const;

const TARGET_INDEXES = [
  { field: 'phone', name: 'phone_1' },
  { field: 'email', name: 'email_1' },
  { field: 'googleId', name: 'googleId_1' },
] as const;

/**
 * Finds values shared by more than one document. Runs on the raw collection so
 * the aggregation sees exactly what the index build will see.
 */
async function findDuplicates(field: string): Promise<Array<{ value: string; count: number; ids: string[] }>> {
  const rows = await User.collection
    .aggregate([
      { $match: { [field]: PRESENT_STRING } },
      // Grouped on the RAW value: the unique index is case-sensitive, so
      // lower-casing here reports 'A@x.com' and 'a@x.com' as a collision and
      // blocks a migration that would actually have succeeded.
      { $group: { _id: `$${field}`, count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  return rows.map((r) => ({
    value: String(r._id),
    count: r.count as number,
    ids: (r.ids as mongoose.Types.ObjectId[]).map((id) => id.toString()),
  }));
}

/** A unique index cannot be built over duplicates; refuse rather than half-migrate. */
async function assertNoDuplicates(): Promise<void> {
  let blocking = 0;

  for (const { field } of TARGET_INDEXES) {
    const dupes = await findDuplicates(field);
    if (!dupes.length) continue;

    blocking += dupes.length;
    console.error(`\n❌ ${dupes.length} duplicate ${field} value(s):`);
    for (const d of dupes) {
      console.error(`   ${d.value}  x${d.count}`);
      d.ids.forEach((id) => console.error(`     ${id}`));
    }
  }

  if (blocking > 0) {
    console.error('\nResolve these by hand before migrating — merging or deleting accounts is');
    console.error('a decision this script must not make for you.');
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log('✅ No duplicate phone / email / googleId values.\n');
}

/** '' is a string and would be indexed; the schema setters stop new ones, this clears old ones. */
async function normalizeEmptyStrings(dryRun: boolean): Promise<void> {
  for (const { field } of TARGET_INDEXES) {
    const filter = { [field]: '' };
    const count = await User.collection.countDocuments(filter);

    if (count === 0) {
      console.log(`  ${field}: no empty strings`);
      continue;
    }
    if (dryRun) {
      console.log(`  ${field}: ${count} document(s) would be set to null`);
      continue;
    }

    const result = await User.collection.updateMany(filter, { $set: { [field]: null } });
    console.log(`  ${field}: ${result.modifiedCount} document(s) set to null`);
  }
}

async function rebuildIndexes(dryRun: boolean): Promise<void> {
  const existing = await User.collection.indexes();

  for (const { field, name } of TARGET_INDEXES) {
    const current = existing.find((i) => i.name === name);
    const filter = current?.partialFilterExpression as Record<string, unknown> | undefined;
    const alreadyCorrect =
      current?.unique === true && JSON.stringify(filter) === JSON.stringify({ [field]: PRESENT_STRING });

    if (alreadyCorrect) {
      console.log(`  ${name}: already correct`);
      continue;
    }

    // Clean up a leftover from an interrupted earlier run. MongoDB refuses two
    // indexes on the same key pattern under different names, so one of these
    // would block the rebuild below.
    const strays = existing.filter((i) => i.name !== name && JSON.stringify(i.key) === JSON.stringify({ [field]: 1 }));

    if (dryRun) {
      strays.forEach((i) => console.log(`  ${name}: would DROP stray ${i.name}`));
      console.log(`  ${name}: would ${current ? 'DROP and recreate' : 'CREATE'}`);
      continue;
    }

    for (const stray of strays) {
      console.log(`  ${name}: dropping stray ${stray.name}`);
      await User.collection.dropIndex(stray.name as string);
    }
    if (current) {
      console.log(`  ${name}: dropping stale index`);
      await User.collection.dropIndex(name);
    }

    // Drop-then-create, with no temporary index in between.
    //
    // Building a replacement under a temp name first LOOKS safer but is not
    // possible: MongoDB rejects a second index on the same key pattern with a
    // different name (IndexOptionsConflict, code 85), and it cannot rename one
    // either. So the brief window with no index is unavoidable — what matters
    // is verifying afterwards rather than assuming.
    console.log(`  ${name}: creating partial unique index`);
    try {
      await User.collection.createIndex(
        { [field]: 1 },
        { unique: true, partialFilterExpression: { [field]: PRESENT_STRING }, name },
      );
    } catch (error) {
      console.error(`\n❌ FAILED to create ${name}. The collection currently has NO unique index on`);
      console.error(`   \`${field}\`, so duplicates can be written until this is resolved.`);
      console.error('   Re-run this script as soon as the cause below is fixed.\n');
      throw error;
    }

    const verified = (await User.collection.indexes()).find((i) => i.name === name);
    if (verified?.unique !== true) {
      throw new Error(`${name} was created but is not unique — refusing to continue`);
    }
  }
}

/** Every pre-existing account authenticated by WhatsApp OTP; record that. */
async function backfillAuthProviders(dryRun: boolean): Promise<void> {
  const filter = { $or: [{ authProviders: { $exists: false } }, { authProviders: { $size: 0 } }] };
  const count = await User.collection.countDocuments(filter);

  if (count === 0) {
    console.log('  authProviders: nothing to backfill');
    return;
  }
  if (dryRun) {
    console.log(`  authProviders: ${count} document(s) would be set to ['${AUTH_PROVIDERS.WHATSAPP}']`);
    return;
  }

  const result = await User.collection.updateMany(filter, { $set: { authProviders: [AUTH_PROVIDERS.WHATSAPP] } });
  console.log(`  authProviders: ${result.modifiedCount} document(s) backfilled`);
}

async function migrate(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const conn = await connectDB();
  console.log(`Connected to ${conn.connection.name}${dryRun ? '  (DRY RUN)' : ''}\n`);

  const before = await User.collection.indexes();
  console.log('Indexes BEFORE:');
  before.forEach((i) => console.log('  ' + JSON.stringify(i)));
  console.log('');

  await assertNoDuplicates();

  console.log('Normalising empty strings to null:');
  await normalizeEmptyStrings(dryRun);
  if (dryRun) {
    console.log("\n  NOTE: in a real run the '' values above are cleared BEFORE the index build,");
    console.log('  so an index reported below as buildable may still fail here until they are.');
  }

  console.log('\nRebuilding indexes:');
  await rebuildIndexes(dryRun);

  console.log('\nBackfilling authProviders:');
  await backfillAuthProviders(dryRun);

  if (!dryRun) {
    const after = await User.collection.indexes();
    console.log('\nIndexes AFTER:');
    after.forEach((i) => console.log('  ' + JSON.stringify(i)));
  }

  await mongoose.connection.close();
  console.log(dryRun ? '\n✅ Dry run complete. Re-run without --dry-run to apply.' : '\n✅ Done.');
  process.exit(0);
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
