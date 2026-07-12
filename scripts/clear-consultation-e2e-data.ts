/**
 * Removes the data the consultation e2e spec creates, so the spec is idempotent.
 *
 * Run: npx tsx --env-file=.env scripts/clear-consultation-e2e-data.ts [YYYY-MM-DD]
 *
 * Deletes the schedule for the given date (default: 21 days out, the spec's target)
 * and every lead booked by the spec's test address. Nothing else is touched.
 */
import mongoose from 'mongoose';
import connectDB from '../src/lib/db/mongodb';
import ConsultationSchedule from '../src/lib/models/consultationSchedule.model';
import ConsultationLead from '../src/lib/models/consultationLead.model';

const E2E_EMAIL = 'e2e-consult@example.com';

function defaultTargetDate(): string {
  const target = new Date(Date.now() + 21 * 86_400_000);
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${target.getFullYear()}-${month}-${day}`;
}

async function main(): Promise<void> {
  const date = process.argv[2] ?? defaultTargetDate();

  await connectDB();

  const leads = await ConsultationLead.deleteMany({ email: E2E_EMAIL });
  const schedules = await ConsultationSchedule.deleteMany({ date });

  console.log(`Cleared ${leads.deletedCount} e2e lead(s) and ${schedules.deletedCount} schedule(s) for ${date}.`);

  await mongoose.disconnect();
}

void main();
