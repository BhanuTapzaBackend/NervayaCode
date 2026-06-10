/**
 * Full reset: wipe all user/therapist/transactional data, KEEP content collections,
 * and re-seed systemconfigs pricing from constants.
 *
 * KEEPS (untouched): driftoffquestions, sleepassessmentquestions, blogs, supplements
 * WIPES: everything else (users, therapists, transactional, etc.)
 * RESEEDS: systemconfigs (4 pricing values) from sleepPlan.constants.ts
 *
 * A full JSON backup was already taken (db-backup-*). Run scripts/seed-admins.ts
 * afterwards (once admins.seed.json is filled) to create the admin accounts.
 */
import connectDB from '../src/lib/db/mongodb';
import mongoose from 'mongoose';
import { configService } from '../src/lib/services/config.service';
import {
  SLEEP_BUNDLE_DISCOUNT_KEY,
  THERAPY_STARTING_PRICE_KEY,
  DEEP_REST_RECOMMENDATION_PRICE_KEY,
  SUPPLEMENT_RECOMMENDATION_PRICE_KEY,
  SLEEP_BUNDLE_DISCOUNT_DEFAULT,
  THERAPY_STARTING_PRICE_DEFAULT,
  DEEP_REST_RECOMMENDATION_PRICE_DEFAULT,
  SUPPLEMENT_RECOMMENDATION_PRICE_DEFAULT,
} from '../src/lib/constants/sleepPlan.constants';

const KEEP = ['driftoffquestions', 'sleepassessmentquestions', 'blogs', 'supplements'];

const WIPE = [
  'users',
  'therapists',
  'therapistschedules',
  'carts',
  'orders',
  'driftofforders',
  'driftoffresponses',
  'sleepassessmentresponses',
  'guestsleepassessmentresponses',
  'sessions',
  'feedbacks',
  'reviews',
  'consultationleads',
  'otptokens',
  'pendingsignups',
  'ratelimits',
  'promocodes',
  'systemconfigs',
];

const PRICING_SEED = [
  {
    key: THERAPY_STARTING_PRICE_KEY,
    value: THERAPY_STARTING_PRICE_DEFAULT,
    description: 'Starting therapy session price shown on the recommendation screen',
  },
  {
    key: DEEP_REST_RECOMMENDATION_PRICE_KEY,
    value: DEEP_REST_RECOMMENDATION_PRICE_DEFAULT,
    description: 'Deep Rest program price shown only on the recommendation screen',
  },
  {
    key: SUPPLEMENT_RECOMMENDATION_PRICE_KEY,
    value: SUPPLEMENT_RECOMMENDATION_PRICE_DEFAULT,
    description: 'Supplement price shown only on the recommendation screen',
  },
  {
    key: SLEEP_BUNDLE_DISCOUNT_KEY,
    value: SLEEP_BUNDLE_DISCOUNT_DEFAULT,
    description: 'Discount % applied to the Sleep Plan bundle (Deep Rest + Supplement [+ Therapy])',
  },
];

async function run() {
  await connectDB();
  const db = mongoose.connection.db!;

  console.log('=== KEEPING (untouched) ===');
  for (const name of KEEP) {
    const n = await db.collection(name).countDocuments();
    console.log(`  ${name.padEnd(30)} ${n} docs`);
  }

  console.log('\n=== WIPING ===');
  for (const name of WIPE) {
    const exists = await db.listCollections({ name }).hasNext();
    if (!exists) {
      console.log(`  ${name.padEnd(30)} (no collection, skipped)`);
      continue;
    }
    const res = await db.collection(name).deleteMany({});
    console.log(`  ${name.padEnd(30)} deleted ${res.deletedCount}`);
  }

  console.log('\n=== RESEEDING systemconfigs from constants ===');
  for (const c of PRICING_SEED) {
    await configService.set(c.key, c.value, undefined, true, c.description);
    console.log(`  ${c.key.padEnd(34)} = ${c.value}`);
  }

  console.log('\n✅ Reset complete. Next: fill scripts/admins.seed.json, then run scripts/seed-admins.ts');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Reset failed:', e);
  process.exit(1);
});
