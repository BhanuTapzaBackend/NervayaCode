import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);

if (REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export async function generateMeetLink(
  date: string, // YYYY-MM-DD
  startTime: string, // H:MM AM/PM
  summary: string = 'Nervaya Therapy Session',
  description: string = 'Your scheduled therapy session with Nervaya.',
): Promise<{ meetLink: string | null; eventId: string | null }> {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.warn('Google Calendar configuration missing. Meet link generation skipped.');
    return { meetLink: null, eventId: null };
  }

  try {
    const [time, period] = startTime.split(' ');
    const [h, m] = time.split(':').map(Number);
    let hours = h;
    if (period?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;

    const startDateTime = new Date(`${date}T${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      conferenceData: {
        createRequest: {
          requestId: `nervaya-session-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return {
      meetLink: response.data.hangoutLink || null,
      eventId: response.data.id || null,
    };
  } catch (error) {
    console.error('Error generating Google Meet link:', error);
    return { meetLink: null, eventId: null };
  }
}

export async function deleteMeeting(eventId: string) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !eventId) return;

  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return false;
  }
}
