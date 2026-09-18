'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Track, ProgressEntry } from '@/types';
import { BUCKET_META } from '@/lib/utils';

interface Props {
  tracks: Track[];
  onClose: () => void;
  onSaved: () => void;
}

export default function QuickLogModal({ tracks, onClose, onSaved }: Props) {
  const [trackId, setTrackId] = useState(tracks[0]?.id ?? '');
  const [minutes, setMinutes] = useState(30);
  const [notes, setNotes]     = useState('');
  const [pct, setPct]         = useState(0);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const selectedTrack = tracks.find((t) => t.id === trackId);
  const meta = selectedTrack ? BUCKET_META[selectedTrack.bucket] : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackId) { setError('Please select a track.'); return; }
    setSaving(true);
    try {
      const entry: ProgressEntry = {
        trackId,
        bucket: selectedTrack!.bucket,
        minutesLogged: minutes,
        notes: notes || undefined,
        completionPct: pct,
      };
      const res = await fetch('/api/progress-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaved();
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="glass"
          style={{ width: '100%', maxWidth: '440px', padding: '1.75rem' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem' }}>
              ⚡ Log Progress
            </h2>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px', minWidth: 0 }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Track selector */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                Track
              </label>
              <select
                id="log-track-select"
                className="input select"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id} style={{ background: 'var(--bg-elevated)' }}>
                    {BUCKET_META[t.bucket].emoji} {t.name}
                  </option>
                ))}
              </select>
              {meta && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                  <span style={{ fontSize: '0.72rem', color: meta.color }}>{meta.label}</span>
                </div>
              )}
            </div>

            {/* Time */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                Time Spent
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[15, 30, 45, 60, 90, 120].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutes(m)}
                    className="btn"
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      background: minutes === m ? (meta?.color ?? 'var(--project)') : 'var(--bg-elevated)',
                      color: minutes === m ? 'white' : 'var(--text-secondary)',
                      border: `1px solid ${minutes === m ? (meta?.color ?? 'var(--project)') : 'var(--border)'}`,
                    }}
                  >
                    {m < 60 ? `${m}m` : `${m / 60}h`}
                  </button>
                ))}
                <input
                  id="log-minutes-custom"
                  type="number"
                  min={1}
                  max={480}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="input"
                  style={{ width: '72px', textAlign: 'center' }}
                  placeholder="min"
                />
              </div>
            </div>

            {/* Completion % */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                Session completion: <span style={{ color: meta?.color ?? 'var(--project)' }}>{pct}%</span>
              </label>
              <input
                id="log-completion-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={pct}
                onChange={(e) => setPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: meta?.color ?? 'var(--project)' }}
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                Notes (optional)
              </label>
              <textarea
                id="log-notes"
                className="input"
                rows={2}
                placeholder="What did you work on?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {error && (
              <p style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.625rem', borderRadius: '8px' }}>
                {error}
              </p>
            )}

            <button
              id="log-submit-btn"
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : '✓ Log it'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
