export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { Track, Bucket } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ── GET /api/tracks ──────────────────────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('tracks')
    .orderBy('createdAt', 'desc')
    .get();

  const tracks = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Track[];
  return NextResponse.json(tracks);
}

// ── POST /api/tracks ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, bucket, description } = body as Pick<Track, 'name' | 'bucket' | 'description'>;

  if (!name || !bucket) return NextResponse.json({ error: 'name and bucket are required' }, { status: 400 });

  // Business rule: enforce active limits
  const existingSnap = await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('tracks')
    .where('bucket', '==', bucket)
    .where('status', '==', 'active')
    .get();

  const activeCount = existingSnap.size;
  const limit = bucket === 'project' ? 2 : bucket === 'craft' ? 1 : Infinity;

  if (activeCount >= limit) {
    const label = bucket === 'project' ? 'Projects' : 'Craft';
    return NextResponse.json(
      { error: `You can only have ${limit} active track(s) in ${label}. Pause or shelve an existing one first.` },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const track: Omit<Track, 'id'> = {
    name,
    bucket,
    description,
    status: 'active',
    promotionHistory: [],
    createdAt: now,
    updatedAt: now,
  };

  const trackData = Object.fromEntries(Object.entries(track).filter(([_, v]) => v !== undefined));

  await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('tracks')
    .doc(id)
    .set(trackData);

  return NextResponse.json({ id, ...trackData }, { status: 201 });
}

// ── PATCH /api/tracks (bulk status update) ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { trackId, updates } = await req.json() as {
    trackId: string;
    updates: Partial<Pick<Track, 'name' | 'status' | 'description' | 'bucket'>>;
  };

  if (!trackId) return NextResponse.json({ error: 'trackId required' }, { status: 400 });

  // If promoting bucket, log the history
  const docRef = adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('tracks')
    .doc(trackId);

  const existing = (await docRef.get()).data() as Track | undefined;
  if (!existing) return NextResponse.json({ error: 'Track not found' }, { status: 404 });

  const updatePayload: Record<string, unknown> = { ...updates, updatedAt: new Date().toISOString() };

  if (updates.bucket && updates.bucket !== existing.bucket) {
    updatePayload.promotionHistory = [
      ...(existing.promotionHistory ?? []),
      { from: existing.bucket as Bucket, to: updates.bucket as Bucket, date: new Date().toISOString() },
    ];
  }

  await docRef.update(updatePayload);
  return NextResponse.json({ success: true });
}

// ── DELETE /api/tracks?trackId=xxx ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const trackId = req.nextUrl.searchParams.get('trackId');
  if (!trackId) return NextResponse.json({ error: 'trackId required' }, { status: 400 });

  await adminDb
    .collection('users')
    .doc(session.user.id)
    .collection('tracks')
    .doc(trackId)
    .delete();

  return NextResponse.json({ success: true });
}
