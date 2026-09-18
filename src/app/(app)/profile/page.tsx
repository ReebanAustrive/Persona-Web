'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserProfile, Achievement } from '@/types';
import { BUCKET_META, formatMinutes } from '@/lib/utils';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) setProfile(await res.json());
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const achievements: Achievement[] = profile.achievements ?? [];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
        <h1 className="section-title">Profile</h1>
      </motion.div>

      {/* User card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}
      >
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? ''}
            style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--border-strong)' }}
          />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--project-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '3px solid var(--border-strong)' }}>
            {session?.user?.name?.[0] ?? '?'}
          </div>
        )}
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {session?.user?.name ?? '—'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{session?.user?.email}</p>
          {profile.joinedAt && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>
              Member since {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}
      >
        <StatCard label="Current Streak" value={`${profile.currentStreak ?? 0}d`} color="var(--curiosity)" emoji="🔥" />
        <StatCard label="Longest Streak" value={`${profile.longestStreak ?? 0}d`} color="var(--project)" emoji="⚡" />
        <StatCard label="Achievements" value={String(achievements.length)} color="var(--craft)" emoji="🏆" />
      </motion.div>

      {/* Lifetime hours per bucket */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass"
        style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
      >
        <h2 style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Lifetime Hours
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(['curiosity', 'project', 'craft'] as const).map((b) => {
            const meta = BUCKET_META[b];
            const hours = 0; // Will be populated from profile data
            const maxHours = 100;
            const pct = Math.min(100, (hours / maxHours) * 100);
            return (
              <div key={b}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: meta.color, fontWeight: 600 }}>{meta.emoji} {meta.label}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hours}h</span>
                </div>
                <div className="progress-track">
                  <motion.div
                    className="progress-fill"
                    style={{ background: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass"
        style={{ padding: '1.5rem' }}
      >
        <h2 style={{ fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
          Achievements {achievements.length > 0 && `· ${achievements.length} unlocked`}
        </h2>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {[1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: '80px', borderRadius: '12px' }} />)}
          </div>
        ) : achievements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏆</div>
            No achievements yet — start logging progress to unlock them!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
            {achievements.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass glass-hover"
                style={{ padding: '1rem', textAlign: 'center' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{a.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{a.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{a.description}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {new Date(a.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, color, emoji }: { label: string; value: string; color: string; emoji: string }) {
  return (
    <div
      className="glass"
      style={{ padding: '1.25rem', textAlign: 'center' }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{emoji}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}
