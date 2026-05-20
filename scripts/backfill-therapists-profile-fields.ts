import connectDB from '@/lib/db/mongodb';
import Therapist from '@/lib/models/therapist.model';

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function backfillTherapists() {
  await connectDB();

  const therapists = await Therapist.find({});
  let updated = 0;

  for (const therapist of therapists) {
    let dirty = false;

    if (!therapist.gender) {
      therapist.gender = 'other';
      dirty = true;
    }

    if (!therapist.slug && therapist.name) {
      therapist.slug = toSlug(therapist.name);
      dirty = true;
    }

    if (!therapist.sessionModes) {
      therapist.sessionModes = [];
      dirty = true;
    }

    if (!therapist.galleryImages) {
      therapist.galleryImages = [];
      dirty = true;
    }

    if (!therapist.testimonials) {
      therapist.testimonials = [];
      dirty = true;
    }

    if (dirty) {
      await therapist.save();
      updated += 1;
    }
  }

  console.log(`Backfill complete. Updated ${updated} therapist records out of ${therapists.length}.`);
}

backfillTherapists()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
