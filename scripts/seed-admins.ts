/**
 * Seeds ADMIN users from scripts/admins.seed.json.
 *
 * Fill admins.seed.json with an array of: { "name": "...", "phone": "+91...", "email": "" }
 * Then run:  node --env-file=.env ./node_modules/.bin/tsx scripts/seed-admins.ts
 *
 * Idempotent: re-running upserts the same admins (matched by normalized phone).
 * Admins authenticate via the normal WhatsApp OTP login flow. Multiple admins are
 * supported — every user with role ADMIN sees the same /admin screens (RBAC).
 */
import * as fs from 'fs';
import * as path from 'path';
import connectDB from '../src/lib/db/mongodb';
import mongoose from 'mongoose';
import User from '../src/lib/models/user.model';
import { ROLES } from '../src/lib/constants/roles';
import { normalizePhone } from '../src/lib/utils/validation.util';

interface AdminEntry {
  name: string;
  phone: string;
  email?: string;
}

async function run() {
  const file = path.join(process.cwd(), 'scripts', 'admins.seed.json');
  const entries: AdminEntry[] = JSON.parse(fs.readFileSync(file, 'utf-8'));

  await connectDB();

  let created = 0;
  let updated = 0;
  for (const entry of entries) {
    if (!entry.name || entry.name.startsWith('REPLACE')) {
      console.log(`⏭️  Skipping placeholder entry: ${JSON.stringify(entry)}`);
      continue;
    }
    const phone = normalizePhone(entry.phone);
    if (!phone) {
      console.log(`❌ Invalid phone, skipped: ${entry.phone}`);
      continue;
    }

    const existing = await User.findOne({ phone });
    const update: Record<string, unknown> = {
      name: entry.name.trim(),
      role: ROLES.ADMIN,
      phoneVerified: true,
    };
    if (entry.email && entry.email.trim()) update.email = entry.email.trim().toLowerCase();

    await User.findOneAndUpdate({ phone }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (existing) {
      updated++;
      console.log(`♻️  Updated admin: ${entry.name} (${phone})`);
    } else {
      created++;
      console.log(`✅ Created admin: ${entry.name} (${phone})`);
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Admin seed failed:', e);
  process.exit(1);
});
