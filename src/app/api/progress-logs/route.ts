export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { ProgressLog, ProgressEntry } from '@/types';
import { checkAndGrantAchievements } from '@/lib/achievements';

// ── GET /api/progress-logs?from=YYYY-MM-DD&to=YYYY-MM-DD ─────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const from = req.nextUrl.searchParams.get('from');
  const to   = req.nextUrl.searchParams.get('to');

  let query = adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('progressLogs')
    .orderBy('date', 'desc') as FirebaseFirestore.Query;

  if (from) query = query.where('date', '>=', from);
  if (to)   query = query.where('date', '<=', to);

  const snap = await query.limit(90).get();
  const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProgressLog[];
  return NextResponse.json(logs);
}

// ── POST /api/progress-logs ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { entry: ProgressEntry };
  const { entry } = body;
  if (!entry?.trackId || entry.minutesLogged == null) {
    return NextResponse.json({ error: 'entry.trackId and entry.minutesLogged are required' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const docRef = adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('progressLogs')
    .doc(today);

  const existing = await docRef.get();
  if (existing.exists) {
    const data = existing.data() as ProgressLog;
    // Upsert: replace or append entry for this trackId
    const entries = data.entries.filter((e) => e.trackId !== entry.trackId);
    entries.push(entry);
    await docRef.update({ entries, date: today });
  } else {
    const log: Omit<ProgressLog, 'id'> = {
      userId: session.user.id,
      date: today,
      entries: [entry],
    };
    await docRef.set(log);
  }

  // Update streak and check achievements
  await updateStreak(session.user.id, today);
  await checkAndGrantAchievements(session.user.id);

  return NextResponse.json({ success: true });
}

// ── Streak helper ─────────────────────────────────────────────────────────────
async function updateStreak(uid: string, today: string) {
  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) return;

  const data = userSnap.data() as { currentStreak?: number; longestStreak?: number; lastLogDate?: string };
  const { currentStreak = 0, longestStreak = 0, lastLogDate } = data;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (lastLogDate === yesterdayStr) {
    newStreak = currentStreak + 1;
  } else if (lastLogDate === today) {
    newStreak = currentStreak; // already logged today
  }

  await userRef.update({
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, longestStreak),
    lastLogDate: today,
  });
}
