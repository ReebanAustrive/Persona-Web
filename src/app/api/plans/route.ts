export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { Plan, Milestone } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ── GET /api/plans?trackId=xxx ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const trackId = req.nextUrl.searchParams.get('trackId');

  // If trackId filter requested, scope to that track's plans sub-collection
  if (trackId) {
    const snap = await adminDb
      .collection('users')
      .doc(session.user.id)
      .collection('tracks')
      .doc(trackId)
      .collection('plans')
      .orderBy('createdAt', 'desc')
      .get();

    const plans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(plans);
  }

  // All plans across all tracks via collectionGroup on Firestore root
  const snap = await adminDb
    .collectionGroup('plans')
    .where('userId', '==', session.user.id)
    .orderBy('createdAt', 'desc')
    .get();

  const plans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(plans);
}

// ── POST /api/plans ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { trackId, title, description, targetDate, milestones = [], linkedResources = [] } = body;

  if (!trackId || !title) return NextResponse.json({ error: 'trackId and title are required' }, { status: 400 });

  const now = new Date().toISOString();
  const id = uuidv4();
  const plan: Omit<Plan, 'id'> = {
    trackId,
    title,
    description,
    targetDate,
    milestones,
    linkedResources,
    progressPct: 0,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  const planData = Object.fromEntries(Object.entries(plan).filter(([_, v]) => v !== undefined));

  await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('tracks')
    .doc(trackId)
    .collection('plans')
    .doc(id)
    .set({ ...planData, userId: session.user.id });

  return NextResponse.json({ id, ...planData }, { status: 201 });
}

// ── PATCH /api/plans ─────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { trackId, planId, updates } = await req.json() as {
    trackId: string;
    planId: string;
    updates: Partial<Plan>;
  };

  if (!trackId || !planId) return NextResponse.json({ error: 'trackId and planId required' }, { status: 400 });

  // Re-compute progress from milestones if they are being updated
  const payload: Record<string, unknown> = { ...updates, updatedAt: new Date().toISOString() };

  if (updates.milestones) {
    const done = (updates.milestones as Milestone[]).filter((m) => m.done).length;
    payload.progressPct = updates.milestones.length
      ? Math.round((done / updates.milestones.length) * 100)
      : 0;
  }

  await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('tracks')
    .doc(trackId)
    .collection('plans')
    .doc(planId)
    .update(payload);

  return NextResponse.json({ success: true });
}

// ── DELETE /api/plans?trackId=x&planId=y ─────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const trackId = req.nextUrl.searchParams.get('trackId');
  const planId = req.nextUrl.searchParams.get('planId');
  if (!trackId || !planId) return NextResponse.json({ error: 'trackId and planId required' }, { status: 400 });

  await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('tracks')
    .doc(trackId)
    .collection('plans')
    .doc(planId)
    .delete();

  return NextResponse.json({ success: true });
}
