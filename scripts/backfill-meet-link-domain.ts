/**
 * Rewrites stored meeting links that were generated against a Vercel deployment
 * hostname (`*.vercel.app`) so they point at the canonical site origin.
 *
 *   npx tsx --env-file=.env scripts/backfill-meet-link-domain.ts --dry-run
 *   npx tsx --env-file=.env scripts/backfill-meet-link-domain.ts
 *
 * Links are frozen into the document at booking time, so fixing
 * NEXT_PUBLIC_APP_URL only affects NEW bookings — existing sessions and
 * consultation leads need this one-off rewrite.
 */
import connectDB from '../src/lib/db/mongodb';
import Session from '../src/lib/models/session.model';
import ConsultationLead from '../src/lib/models/consultationLead.model';
import { getSiteUrl } from '../src/lib/utils/site-url.util';

const VERCEL_LINK = /^https?:\/\/[^/]*vercel\.app/i;

interface HasMeetLink {
  _id: unknown;
  meetLink?: string;
}

type LinkModel = { find: (q: object) => { lean: () => Promise<HasMeetLink[]> }; updateOne: Function };

async function rewrite(model: LinkModel, label: string, siteUrl: string, dryRun: boolean): Promise<number> {
  const docs = await model.find({ meetLink: { $regex: VERCEL_LINK } }).lean();

  for (const doc of docs) {
    const updated = (doc.meetLink ?? '').replace(VERCEL_LINK, siteUrl);
    console.log(`  ${label} ${String(doc._id)}\n    ${doc.meetLink}\n -> ${updated}`);
    if (!dryRun) {
      await model.updateOne({ _id: doc._id }, { $set: { meetLink: updated } });
    }
  }

  return docs.length;
}

async function backfill(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const siteUrl = getSiteUrl();

  if (VERCEL_LINK.test(siteUrl)) {
    console.error(`Refusing to run: resolved site URL is still a Vercel host (${siteUrl}).`);
    process.exit(1);
  }

  const conn = await connectDB();
  console.log(`Connected to ${conn.connection.name}`);
  console.log(`Rewriting *.vercel.app meeting links to ${siteUrl}${dryRun ? '  (DRY RUN)' : ''}\n`);

  const sessions = await rewrite(Session as unknown as LinkModel, 'session', siteUrl, dryRun);
  const leads = await rewrite(ConsultationLead as unknown as LinkModel, 'lead', siteUrl, dryRun);

  console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${sessions} session(s) and ${leads} consultation lead(s).`);
  await conn.connection.close();
}

backfill().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
