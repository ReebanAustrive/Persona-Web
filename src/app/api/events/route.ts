export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { AppEvent } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { createCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';

// ── GET /api/events ──────────────────────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('events')
    .orderBy('start', 'asc')
    .get();

  const events = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AppEvent[];
  return NextResponse.json(events);
}

// ── POST /api/events ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.accessToken)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as Omit<AppEvent, 'id' | 'createdAt'> & { pushToCalendar?: boolean };
  const { title, start, end, trackId, bucket, description, allDay, pushToCalendar } = body;

  if (!title || !start) return NextResponse.json({ error: 'title and start are required' }, { status: 400 });

  let googleCalendarEventId: string | undefined;
  if (pushToCalendar && session.accessToken) {
    try {
      const gcEvent = await createCalendarEvent(session.accessToken, {
        summary: title,
        description: description ?? '',
        start: allDay ? { date: start.split('T')[0] } : { dateTime: start },
        end: allDay ? { date: (end ?? start).split('T')[0] } : { dateTime: end ?? start },
      });
      googleCalendarEventId = gcEvent.id ?? undefined;
    } catch {
      // Non-fatal — continue saving locally
    }
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const event: Omit<AppEvent, 'id'> = {
    title,
    start,
    end: end ?? start,
    trackId,
    bucket,
    description,
    allDay,
    googleCalendarEventId,
    createdAt: now,
  };

  const eventData = Object.fromEntries(Object.entries(event).filter(([_, v]) => v !== undefined));

  await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('events')
    .doc(id)
    .set(eventData);

  return NextResponse.json({ id, ...eventData }, { status: 201 });
}

// ── DELETE /api/events?eventId=xxx ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const eventId = req.nextUrl.searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

  const docRef = adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('events')
    .doc(eventId);

  const snap = await docRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const event = snap.data() as AppEvent;
  if (event.googleCalendarEventId && session.accessToken) {
    try {
      await deleteCalendarEvent(session.accessToken, event.googleCalendarEventId);
    } catch {
      // Non-fatal
    }
  }

  await docRef.delete();
  return NextResponse.json({ success: true });
}
