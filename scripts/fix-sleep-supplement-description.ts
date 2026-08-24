import connectDB from '@/lib/db/mongodb';
import Supplement from '@/lib/models/supplement.model';

const CLEAN_DESCRIPTION = `<p>Nervaya Deep Sleep Support is a carefully formulated herbal Ayurvedic blend designed to calm the mind, reduce nighttime restlessness, and support your body's natural sleep cycle &mdash; without melatonin or habit-forming ingredients.</p><p>Unlike quick-fix sleep aids, Nervaya focuses on long-term sleep improvement by combining Ayurvedic supplementation, nervous system calming, and mental wellness support, making it a complete sleep wellness solution rather than a one-off aid.</p><p>Each bottle contains 60 capsules (30 servings), manufactured under quality-controlled conditions with standardized herbal extracts. This product is not intended to diagnose, treat, cure, or prevent any disease &mdash; consult your physician if pregnant, nursing, or under medication.</p>`;

async function fixDescription() {
  await connectDB();

  const result = await Supplement.updateOne(
    { name: 'Nervaya Sleep Supplement' },
    { $set: { description: CLEAN_DESCRIPTION } },
  );

  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount}`);
}

fixDescription()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
