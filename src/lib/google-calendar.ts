import { google } from 'googleapis';

function getOAuth2Client(accessToken: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ access_token: accessToken });
  return client;
}

interface CalendarEventBody {
  summary: string;
  description: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end:   { dateTime?: string; date?: string; timeZone?: string };
}

export async function createCalendarEvent(accessToken: string, body: CalendarEventBody) {
  const auth = getOAuth2Client(accessToken);
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: body,
  });
  return res.data;
}

export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const auth = getOAuth2Client(accessToken);
  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({ calendarId: 'primary', eventId });
}

export async function listUpcomingCalendarEvents(accessToken: string, maxResults = 20) {
  const auth = getOAuth2Client(accessToken);
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items ?? [];
}
