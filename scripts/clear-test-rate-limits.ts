/**
 * Clears OTP/login rate-limit counters for the seeded e2e test phones so the
 * suite's fresh-login tests (TC-013/014) aren't blocked by the 5-sends/hour cap.
 * Only touches the test accounts. Run: npx tsx --env-file=.env scripts/clear-test-rate-limits.ts
 */
import connectDB from '../src/lib/db/mongodb';
import RateLimit from '../src/lib/models/rateLimit.model';

const PHONES = ['+919000000001', '+919000000002', '+919000000003'];

async function main() {
  await connectDB();
  const res = await RateLimit.deleteMany({
    key: { $regex: PHONES.map((p) => p.replace('+', '\\+')).join('|') },
  });
  console.log(`Cleared ${res.deletedCount} rate-limit record(s) for test phones.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
