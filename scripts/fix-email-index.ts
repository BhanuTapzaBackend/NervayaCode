/**
 * Root-cause fix for the "User already exists" / "Account Not Found" signup bug.
 *
 * The live DB has a stale `email_1` index that is { unique: true, sparse: true }.
 * Because `email` defaults to null on every user, a SPARSE index still indexes the
 * null value — so only the first null-email user succeeds and every later signup
 * throws E11000 (surfaced as "User already exists"), leaving the user uncreated
 * (hence "Account Not Found" at login).
 *
 * This drops the stale index and recreates it as the PARTIAL index the schema
 * declares ({ email: { $type: 'string' } }), which correctly excludes null emails.
 */
import connectDB from '../src/lib/db/mongodb';
import User from '../src/lib/models/user.model';
import mongoose from 'mongoose';

async function fix() {
  await connectDB();
  console.log('✅ Connected to MongoDB\n');

  const before = await User.collection.indexes();
  console.log('Indexes BEFORE:');
  before.forEach((i) => console.log('  ' + JSON.stringify(i)));

  const hasEmailIndex = before.some((i) => i.name === 'email_1');
  if (hasEmailIndex) {
    console.log('\nDropping stale email_1 index...');
    await User.collection.dropIndex('email_1');
  } else {
    console.log('\nNo email_1 index present; will create fresh.');
  }

  console.log('Creating partial unique index on email (excludes null)...');
  await User.collection.createIndex(
    { email: 1 },
    { unique: true, partialFilterExpression: { email: { $type: 'string' } }, name: 'email_1' },
  );

  const after = await User.collection.indexes();
  console.log('\nIndexes AFTER:');
  after.forEach((i) => console.log('  ' + JSON.stringify(i)));

  await mongoose.connection.close();
  console.log('\n✅ Done. New signups with null email will no longer collide.');
  process.exit(0);
}

fix().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
