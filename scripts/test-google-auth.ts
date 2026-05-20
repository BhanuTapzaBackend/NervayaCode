import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

async function testAuth() {
  console.log('--- Testing Google Auth ---');
  console.log('Client ID:', CLIENT_ID ? 'Set' : 'Missing');
  console.log('Client Secret:', CLIENT_SECRET ? 'Set' : 'Missing');
  console.log('Refresh Token:', REFRESH_TOKEN ? 'Set' : 'Missing');

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('Missing required environment variables in .env');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    console.log('Attempting to fetch calendar list...');
    const res = await calendar.calendarList.list();
    console.log('✅ Success! Found ' + (res.data.items?.length || 0) + ' calendars.');
    console.log('--- Auth is valid ---');
  } catch (error: any) {
    console.error('❌ Auth Failed');
    if (error.response?.data) {
      console.error('API Error details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAuth();
