'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Plus, Flame, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import QuickLogModal from '@/components/QuickLogModal';
import { Track, ProgressLog, Task } from '@/types';
import { BUCKET_META, formatMinutes, todayISO } from '@/lib/utils';

interface BucketSummary {
  totalMinutes: number;
  targetMinutes: number;
  pct: number;
}

const DAILY_TARGETS: Record<string, number> = {
  curiosity: 30,
  project: 60,
  craft: 45,
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [todayLog, setTodayLog] = useState<ProgressLog | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ currentStreak: 0, longestStreak: 0, weeklyPct: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tracksRes, logsRes] = await Promise.all([
        fetch('/api/tracks'),
        fetch(`/api/progress-logs?from=${todayISO()}&to=${todayISO()}`),
      ]);

      if (!tracksRes.ok) {
        const err = await tracksRes.text();
        console.error(`[dashboard] /api/tracks ${tracksRes.status}:`, err);
        return;
      }
      if (!logsRes.ok) {
        const err = await logsRes.text();
        console.error(`[dashboard] /api/progress-logs ${logsRes.status}:`, err);
        return;
      }

      const tracksData: Track[] = await tracksRes.json();
      const logsData: ProgressLog[] = await logsRes.json();

      setTracks(tracksData.filter((t) => t.status === 'active'));
      setTodayLog(logsData[0] ?? null);
    } catch (err) {
      console.error('[dashboard] fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function getBucketSummary(bucket: string): BucketSummary {
    const entries = todayLog?.entries.filter((e) => e.bucket === bucket) ?? [];
    const totalMinutes = entries.reduce((s, e) => s + e.minutesLogged, 0);
    const targetMinutes = DAILY_TARGETS[bucket] ?? 30;
    const pct = Math.min(100, Math.round((totalMinutes / targetMinutes) * 100));
    return { totalMinutes, targetMinutes, pct };
  }

  const buckets = (['curiosity', 'project', 'craft'] as const);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const activeTracks = tracks.filter((t) => t.status === 'active');

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{today}</p>
          <h1 className="section-title">
            Good {getGreeting()},{' '}
            <span style={{ background: 'linear-gradient(90deg, var(--project), var(--craft))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {session?.user?.name?.split(' ')[0] ?? 'there'}
            </span>
          </h1>
        </div>

        <button
          id="quick-log-btn"
          onClick={() => setShowLog(true)}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <Plus size={16} /> Log Progress
        </button>
      </motion.div>

      {/* Streak bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass"
        style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <StatPill icon={<Flame size={16} color="#F59E0B" />} label="Current Streak" value={`${userStats.currentStreak}d`} color="var(--curiosity)" />
        <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
        <StatPill icon={<TrendingUp size={16} color="var(--project)" />} label="Longest Streak" value={`${userStats.longestStreak}d`} color="var(--project)" />
        <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />
        <StatPill icon={<CheckCircle2 size={16} color="var(--craft)" />} label="Weekly Consistency" value={`${userStats.weeklyPct}%`} color="var(--craft)" />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {formatMinutes(todayLog?.entries.reduce((s, e) => s + e.minutesLogged, 0) ?? 0)} logged today
          </span>
        </div>
      </motion.div>

      {/* Progress Rings */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '2rem',
        }}
      >
        {buckets.map((bucket) => {
          const meta = BUCKET_META[bucket];
          const summary = getBucketSummary(bucket);
          const bucketTracks = activeTracks.filter((t) => t.bucket === bucket);
          return (
            <div key={bucket} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <ProgressRing
                pct={summary.pct}
                size={130}
                color={meta.color}
                glowColor={meta.glowColor}
                label={meta.label}
                sublabel={`${formatMinutes(summary.totalMinutes)} / ${formatMinutes(summary.targetMinutes)}`}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', maxWidth: '140px' }}>
                {bucketTracks.map((t) => (
                  <span key={t.id} className="badge" style={{ color: meta.color, borderColor: `${meta.color}44`, background: meta.dimColor, fontSize: '0.65rem' }}>
                    {t.name}
                  </span>
                ))}
                {bucketTracks.length === 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No active tracks</span>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Active Track Widgets */}
      <h2 style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
        Active Tracks
      </h2>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass shimmer" style={{ height: '140px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : activeTracks.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No active tracks yet.</p>
          <a href="/career" className="btn btn-primary" style={{ display: 'inline-flex' }}>Go to Career →</a>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}
        >
          {activeTracks.map((track, i) => {
            const meta = BUCKET_META[track.bucket];
            const entry = todayLog?.entries.find((e) => e.trackId === track.id);
            const minutesToday = entry?.minutesLogged ?? 0;
            const target = DAILY_TARGETS[track.bucket] ?? 30;
            const pct = Math.min(100, Math.round((minutesToday / target) * 100));

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="glass glass-hover"
                style={{ padding: '1.25rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="badge" style={{ color: meta.color, borderColor: `${meta.color}44`, background: meta.dimColor, marginBottom: '0.5rem' }}>
                      {meta.emoji} {meta.label}
                    </span>
                    <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{track.name}</h3>
                  </div>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: meta.color, fontFamily: 'Outfit, sans-serif' }}>
                    {pct}%
                  </span>
                </div>

                <div className="progress-track" style={{ marginBottom: '0.5rem' }}>
                  <motion.div
                    className="progress-fill"
                    style={{ background: meta.color, width: `${pct}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + i * 0.05 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>{formatMinutes(minutesToday)} today</span>
                  <span>target: {formatMinutes(target)}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Quick Log Modal */}
      {showLog && (
        <QuickLogModal
          tracks={activeTracks}
          onClose={() => setShowLog(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      {icon}
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
      </div>
    </div>
  );
}
