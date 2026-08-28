/**
 * Builds the unique index on `Therapist.email`.
 *
 *   npx tsx --env-file=.env scripts/migrate-therapist-email-index.ts --dry-run
 *   npx tsx --env-file=.env scripts/migrate-therapist-email-index.ts
 *
 * Run `scripts/audit-therapist-emails.ts` first and clear everything it flags.
 *
 * Why a script rather than Mongoose autoIndex: Mongoose never drops indexes, and
 * `createIndex` under an existing name with different options fails with
 * IndexOptionsConflict on the model's `index` event — which nothing listens to.
 * It fails SILENTLY, the stale index survives, and the collision only shows up
 * later as a mystery E11000. `scripts/fix-email-index.ts` exists because of
 * exactly this; do not repeat it.
 *
 * The index is deliberately plain, not partial: email is required, so there is
 * no legitimate null to exclude, and a partial index would silently permit
 * several therapists sharing '' — the exact invariant break we are closing.
 *
 * All reads go through `.collection`, never the model: a model query triggers
 * Mongoose's own index build, which would race the guard below.
 *
 * Safe to re-run.
 */
import mongoose from 'mongoose';

import connectDB from '../src/lib/db/mongodb';
import Therapist from '../src/lib/models/therapist.model';
import { validateEmail } from '../src/lib/utils/validation.util';

const INDEX_NAME = 'email_1';

interface TherapistRow {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
}

/** Refuses the migration unless every therapist holds a distinct, valid email. */
async function assertDataIsClean(): Promise<void> {
  const therapists = (await Therapist.collection
    .find({}, { projection: { _id: 1, name: 1, email: 1 } })
    .toArray()) as unknown as TherapistRow[];
  const seen = new Map<string, string>();
  const problems: string[] = [];

  for (const t of therapists) {
    const email = (t.email || '').trim().toLowerCase();
    const label = `${t._id.toString()} (${t.name || 'unnamed'})`;

    if (!email) {
      problems.push(`${label}: no email`);
      continue;
    }
    if (!validateEmail(email)) {
      problems.push(`${label}: malformed email ${JSON.stringify(t.email)}`);
      continue;
    }
    const existing = seen.get(email);
    if (existing) {
      problems.push(`${label}: email ${email} already used by ${existing}`);
      continue;
    }
    seen.set(email, label);
  }

  if (problems.length) {
    console.error(`\n❌ Refusing to migrate — ${problems.length} problem(s):\n`);
    problems.forEach((p) => console.error(`  ${p}`));
    console.error('\nFix these in /admin/therapists, then re-run.');
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log(`✅ ${therapists.length} therapist(s), all with distinct valid emails.\n`);
}

async function migrate(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const conn = await connectDB();
  console.log(`Connected to ${conn.connection.name}${dryRun ? '  (DRY RUN)' : ''}\n`);

  const before = await Therapist.collection.indexes();
  console.log('Indexes BEFORE:');
  before.forEach((i) => console.log('  ' + JSON.stringify(i)));
  console.log('');

  await assertDataIsClean();

  const existing = before.find((i) => i.name === INDEX_NAME);
  const alreadyCorrect = existing?.unique === true && !existing.partialFilterExpression;

  if (alreadyCorrect) {
    console.log('Index is already a plain unique index — nothing to do.');
    await mongoose.connection.close();
    process.exit(0);
  }

  if (dryRun) {
    console.log(
      existing ? `Would DROP stale ${INDEX_NAME} and recreate it as unique.` : `Would CREATE unique ${INDEX_NAME}.`,
    );
    await mongoose.connection.close();
    process.exit(0);
  }

  if (existing) {
    console.log(`Dropping stale ${INDEX_NAME}...`);
    await Therapist.collection.dropIndex(INDEX_NAME);
  }

  console.log(`Creating unique ${INDEX_NAME}...`);
  await Therapist.collection.createIndex({ email: 1 }, { unique: true, name: INDEX_NAME });

  const after = await Therapist.collection.indexes();
  console.log('\nIndexes AFTER:');
  after.forEach((i) => console.log('  ' + JSON.stringify(i)));

  await mongoose.connection.close();
  console.log('\n✅ Done. Therapist.email is now the unique identity key.');
  process.exit(0);
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
