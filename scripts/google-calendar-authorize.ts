/**
 * One-time: grants Nervaya offline access to a Google account's calendar and
 * prints the refresh token to put in GOOGLE_CALENDAR_REFRESH_TOKEN.
 *
 *   # 1. print the consent URL, open it, approve as the Nervaya ops account
 *   npx tsx --env-file=.env scripts/google-calendar-authorize.ts
 *
 *   # 2. paste back the ?code=... value from the URL you were redirected to
 *   npx tsx --env-file=.env scripts/google-calendar-authorize.ts <code>
 *
 * Needed only in `oauth` mode (GOOGLE_CALENDAR_AUTH_MODE unset or 'oauth'),
 * which is the mode that works without Google Workspace. Under `delegated`
 * mode a service account replaces this entirely and no token is stored.
 *
 * BEFORE RUNNING
 *   • Enable the Google Calendar API on the GCP project.
 *   • Create an OAuth client of type "Web application".
 *   • Add the redirect URI below to that client's authorised list.
 *   • On the OAuth consent screen, PUBLISH THE APP ("In production").
 *     While it is in "Testing", Google expires refresh tokens after 7 DAYS for
 *     sensitive scopes like calendar.events — meaning session links would stop
 *     being created every week until someone re-ran this script. Published-but-
 *     unverified is fine here: you click through one "Google hasn't verified
 *     this app" warning, once, as the account that owns the calendar.
 *
 * The printed token is a long-lived credential for that account's entire
 * calendar. Treat it like JWT_SECRET: server-only, never NEXT_PUBLIC_.
 */
import { google } from 'googleapis';

const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI?.trim() || 'http://localhost:3000/oauth2callback';
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`❌ ${name} is not set. Add it to .env first.`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const clientId = requireEnv('GOOGLE_CLIENT_ID');
  const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET');
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const code = process.argv[2];

  if (!code) {
    const url = oauth2.generateAuthUrl({
      // Without offline access Google returns only a short-lived access token
      // and no refresh token at all.
      access_type: 'offline',
      // Forces the consent screen even if this account has approved before —
      // Google only returns a refresh token on a FRESH grant, so re-running
      // without this yields a response with no refresh_token in it.
      prompt: 'consent',
      scope: [SCOPE],
    });

    console.log('\n1. Open this URL and approve as the account that should own every session event:\n');
    console.log(`   ${url}\n`);
    console.log(
      `2. You will be redirected to ${REDIRECT_URI}?code=...  (the page itself will not load — that is fine)`,
    );
    console.log('3. Copy the `code` query parameter and re-run:\n');
    console.log('   npx tsx --env-file=.env scripts/google-calendar-authorize.ts <code>\n');
    return;
  }

  const { tokens } = await oauth2.getToken(decodeURIComponent(code));

  if (!tokens.refresh_token) {
    console.error('\n❌ Google returned no refresh_token.');
    console.error('   This happens when the account has already granted access. Either revoke Nervaya at');
    console.error('   https://myaccount.google.com/permissions and retry, or confirm prompt=consent was sent.\n');
    process.exit(1);
  }

  // Prove the grant actually works before anyone puts it in an env file.
  //
  // Deliberately events.list, NOT calendarList.list: the latter needs
  // calendar.readonly or broader, which we intentionally did not request. A
  // verification step that demands a wider scope than the app uses would either
  // fail here or push us into over-granting.
  oauth2.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2 });
  const probe = await calendar.events.list({ calendarId: 'primary', maxResults: 1 });

  console.log('\n✅ Authorized and verified against the primary calendar.');
  console.log(`   Calendar : ${probe.data.summary ?? 'primary'}`);
  console.log(`   Timezone : ${probe.data.timeZone ?? 'unknown'}\n`);
  console.log('Add these to .env:\n');
  console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`);
  if (probe.data.summary) console.log(`GOOGLE_CALENDAR_ACCOUNT=${probe.data.summary}`);
  console.log('MEETING_PROVIDER=google');
  console.log('');
}

main().catch((error) => {
  console.error('❌ Authorization failed:', error);
  process.exit(1);
});
