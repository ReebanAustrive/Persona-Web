export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const docRef = adminDb.collection('users').doc(session.user.id);
  const snap = await docRef.get();

  if (!snap.exists) {
    // Create profile on first sign-in
    const newProfile = {
      uid: session.user.id,
      name: session.user.name,
      email: session.user.email,
      photoURL: session.user.image,
      joinedAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      weeklyConsistencyPct: 0,
    };
    const profileData = Object.fromEntries(Object.entries(newProfile).filter(([_, v]) => v !== undefined));
    await docRef.set(profileData);
    return NextResponse.json(profileData);
  }

  return NextResponse.json({ id: snap.id, ...snap.data() });
}
