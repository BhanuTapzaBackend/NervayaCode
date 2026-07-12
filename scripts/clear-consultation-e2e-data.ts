/**
 * Removes the data the consultation e2e spec creates, so the spec is idempotent.
 *
 * Run: npx tsx --env-file=.env scripts/clear-consultation-e2e-data.ts <fromDate> [toDate]
 *
 * Deletes every schedule in the given date range and every lead booked by the
 * spec's test contacts. Nothing else is touched.
 */
import mongoose from 'mongoose';
import connectDB from '../src/lib/db/mongodb';
import ConsultationSchedule from '../src/lib/models/consultationSchedule.model';
import ConsultationLead from '../src/lib/models/consultationLead.model';

const E2E_EMAIL = 'e2e-consult@example.com';
const E2E_MOBILE = '9000000123';

function defaultTargetDate(): string {
  const target = new Date(Date.now() + 21 * 86_400_000);
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${target.getFullYear()}-${month}-${day}`;
}

async function main(): Promise<void> {
  const from = process.argv[2] ?? defaultTargetDate();
  const to = process.argv[3] ?? from;

  await connectDB();

  const leads = await ConsultationLead.deleteMany({
    $or: [{ email: E2E_EMAIL }, { mobile: E2E_MOBILE }],
  });
  const schedules = await ConsultationSchedule.deleteMany({ date: { $gte: from, $lte: to } });

  console.log(`Cleared ${leads.deletedCount} e2e lead(s) and ${schedules.deletedCount} schedule(s) in ${from}..${to}.`);

  await mongoose.disconnect();
}

void main();
