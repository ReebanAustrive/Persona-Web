import { adminDb } from '@/lib/firebase-admin';
import { Achievement, UserProfile } from '@/types';

const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_log',       title: 'First Step',        description: 'Log your first progress entry.',          icon: '👣' },
  { id: 'streak_3',        title: 'Warming Up',        description: 'Maintain a 3-day streak.',                 icon: '🔥' },
  { id: 'streak_7',        title: 'Week Warrior',      description: 'Maintain a 7-day streak.',                 icon: '⚡' },
  { id: 'streak_30',       title: 'Month Master',      description: 'Maintain a 30-day streak.',                icon: '🏅' },
  { id: 'first_milestone', title: 'Milestone Hunter',  description: 'Complete your first plan milestone.',      icon: '🎯' },
  { id: 'promoted_track',  title: 'Level Up',          description: 'Promote a track to a higher bucket.',     icon: '⬆️' },
  { id: 'craft_active',    title: 'The Craftsman',     description: 'Activate a track in the Craft bucket.',   icon: '💎' },
  { id: 'hours_10',        title: '10 Hours In',       description: 'Log 10 total hours of progress.',         icon: '⏱️' },
  { id: 'hours_100',       title: 'Century Club',      description: 'Log 100 total hours of progress.',        icon: '💯' },
  { id: 'plan_complete',   title: 'Shipped',           description: 'Complete all milestones in a plan.',      icon: '✅' },
];

export async function checkAndGrantAchievements(uid: string) {
  const userRef = adminDb.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const user = userSnap.data() as UserProfile;
  const existing = new Set((user.achievements ?? []).map((a) => a.id));
  const toGrant: Achievement[] = [];
  const now = new Date().toISOString();

  // Helper
  function grant(id: string) {
    if (existing.has(id)) return;
    const def = ALL_ACHIEVEMENTS.find((a) => a.id === id);
    if (def) toGrant.push({ ...def, unlockedAt: now });
  }

  // Streak-based
  const streak = user.currentStreak ?? 0;
  if (streak >= 1)  grant('first_log');
  if (streak >= 3)  grant('streak_3');
  if (streak >= 7)  grant('streak_7');
  if (streak >= 30) grant('streak_30');

  // Hours-based — sum all progress logs
  const logsSnap = await adminDb
    .collection('users').doc(uid).collection('progressLogs').get();

  let totalMinutes = 0;
  for (const doc of logsSnap.docs) {
    const log = doc.data();
    for (const entry of log.entries ?? []) {
      totalMinutes += entry.minutesLogged ?? 0;
    }
  }
  const totalHours = totalMinutes / 60;
  if (totalHours >= 10)  grant('hours_10');
  if (totalHours >= 100) grant('hours_100');

  // Promoted track check
  const tracksSnap = await adminDb
    .collection('users').doc(uid).collection('tracks').get();

  for (const doc of tracksSnap.docs) {
    const track = doc.data();
    if ((track.promotionHistory ?? []).length > 0) { grant('promoted_track'); }
    if (track.bucket === 'craft' && track.status === 'active') { grant('craft_active'); }
  }

  // Milestone and plan completion
  for (const trackDoc of tracksSnap.docs) {
    const plansSnap = await adminDb
      .collection('users').doc(uid).collection('tracks').doc(trackDoc.id).collection('plans').get();

    for (const planDoc of plansSnap.docs) {
      const plan = planDoc.data();
      const milestones: { done: boolean }[] = plan.milestones ?? [];
      if (milestones.some((m) => m.done)) grant('first_milestone');
      if (milestones.length > 0 && milestones.every((m) => m.done)) grant('plan_complete');
    }
  }

  if (toGrant.length > 0) {
    await userRef.update({
      achievements: [...(user.achievements ?? []), ...toGrant],
    });
  }
}
