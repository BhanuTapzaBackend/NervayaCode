/**
 * Creates (or updates) the fixed OTP-bypass test accounts defined in
 * src/lib/constants/test-logins.ts.
 *
 *   npx tsx --env-file=.env scripts/seed-test-logins.ts
 *
 * Run it once against every database you want to test on — the login route
 * refuses numbers with no account, so the bypass alone is not enough.
 */
import connectDB from '../src/lib/db/mongodb';
import User from '../src/lib/models/user.model';
import Therapist from '../src/lib/models/therapist.model';
import { generateSlotsFromConsultingHours } from '../src/lib/services/therapistSchedule-generate.service';
import { TEST_LOGINS, type TestLogin } from '../src/lib/constants/test-logins';

/**
 * Creates the Therapist document a THERAPIST user must point at, and generates
 * its bookable slots. Returns the profile id to store on the User.
 */
async function seedTherapistProfile(entry: TestLogin): Promise<string | undefined> {
  if (!entry.therapistProfile) return undefined;

  const profile = await Therapist.findOneAndUpdate(
    { email: entry.email },
    { ...entry.therapistProfile, name: entry.name, email: entry.email, isAvailable: true },
    { upsert: true, new: true, runValidators: true },
  );
  if (!profile) throw new Error(`Failed to seed therapist profile for ${entry.email}`);

  const id = profile._id.toString();
  const slots = await generateSlotsFromConsultingHours(id, new Date(), 30);
  console.log(`             ↳ therapist profile ${id} (${slots.modifiedCount} day(s) of slots)`);

  return id;
}

async function seedTestLogins(): Promise<void> {
  const conn = await connectDB();
  console.log(`Connected to ${conn.connection.name}\n`);

  for (const entry of TEST_LOGINS) {
    const { phone, otp, role, name, email } = entry;
    console.log(`  ${role.padEnd(9)} ${phone}   OTP ${otp}   (${name})`);

    const therapistId = await seedTherapistProfile(entry);

    await User.findOneAndUpdate(
      { phone },
      { phone, email, name, role, phoneVerified: true, emailVerified: true, ...(therapistId && { therapistId }) },
      { upsert: true, new: true, runValidators: true },
    );
  }

  console.log('\nDone. Log in at /login with the number above, then that OTP.');
  await conn.connection.close();
}

seedTestLogins().catch((error) => {
  console.error('Seeding test logins failed:', error);
  process.exit(1);
});
