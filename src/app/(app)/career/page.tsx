'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, ArrowUpCircle, Archive, Trash2, X, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { Track, Plan, Bucket, Milestone } from '@/types';
import { BUCKET_META, computePlanProgress, formatDate } from '@/lib/utils';

type BucketTab = Bucket | 'all';

export default function CareerPage() {
  const [tracks, setTracks]   = useState<Track[]>([]);
  const [plans, setPlans]     = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState<BucketTab>('all');
  const [showTrackDrawer, setShowTrackDrawer] = useState(false);
  const [showPlanDrawer, setShowPlanDrawer]   = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tracksRes] = await Promise.all([fetch('/api/tracks')]);
      const tracksData: Track[] = await tracksRes.json();
      setTracks(tracksData);

      // Fetch all plans
      const planFetches = tracksData.map((t) =>
        fetch(`/api/plans?trackId=${t.id}`).then((r) => r.json())
      );
      const allPlans = (await Promise.all(planFetches)).flat() as Plan[];
      setPlans(allPlans);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const buckets: Bucket[] = ['curiosity', 'project', 'craft'];
  const visibleBuckets = activeTab === 'all' ? buckets : [activeTab as Bucket];

  async function handleTrackStatusChange(trackId: string, status: Track['status']) {
    await fetch('/api/tracks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId, updates: { status } }),
    });
    fetchData();
  }

  async function handlePromote(track: Track) {
    const promotions: Record<Bucket, Bucket | null> = { curiosity: 'project', project: 'craft', craft: null };
    const nextBucket = promotions[track.bucket];
    if (!nextBucket) return;
    if (!confirm(`Promote "${track.name}" from ${BUCKET_META[track.bucket].label} → ${BUCKET_META[nextBucket].label}?`)) return;
    const res = await fetch('/api/tracks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: track.id, updates: { bucket: nextBucket } }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? 'Promotion failed');
    fetchData();
  }

  async function handleDeleteTrack(trackId: string) {
    if (!confirm('Delete this track and all its plans? This cannot be undone.')) return;
    await fetch(`/api/tracks?trackId=${trackId}`, { method: 'DELETE' });
    fetchData();
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 className="section-title">Career & Plans</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Manage your tracks, plans, and milestones across all three buckets.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button id="add-track-btn" onClick={() => setShowTrackDrawer(true)} className="btn btn-ghost">
            <Plus size={16} /> New Track
          </button>
          <button id="add-plan-btn" onClick={() => setShowPlanDrawer(true)} className="btn btn-primary">
            <Plus size={16} /> New Plan
          </button>
        </div>
      </motion.div>

      {/* Bucket tab filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {(['all', ...buckets] as BucketTab[]).map((tab) => {
          const meta = tab !== 'all' ? BUCKET_META[tab] : null;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className="btn"
              style={{
                background: isActive ? (meta?.color ?? 'var(--text-primary)') + '22' : 'transparent',
                color: isActive ? (meta?.color ?? 'var(--text-primary)') : 'var(--text-muted)',
                border: `1px solid ${isActive ? (meta?.color ?? 'var(--border-strong)') + '55' : 'var(--border)'}`,
              }}
            >
              {tab === 'all' ? '⊙ All' : `${meta!.emoji} ${meta!.label}`}
            </button>
          );
        })}
      </div>

      {/* Three-column layout */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3].map((i) => <div key={i} className="glass shimmer" style={{ height: '300px', borderRadius: '16px' }} />)}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: visibleBuckets.length === 1 ? '1fr' : `repeat(${visibleBuckets.length}, 1fr)`,
          gap: '1.5rem',
          alignItems: 'start',
        }}>
          {visibleBuckets.map((bucket) => {
            const meta = BUCKET_META[bucket];
            const bucketTracks = tracks.filter((t) => t.bucket === bucket);
            const activeCt = bucketTracks.filter((t) => t.status === 'active').length;
            const limit = bucket === 'project' ? 2 : bucket === 'craft' ? 1 : Infinity;

            return (
              <motion.div
                key={bucket}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: buckets.indexOf(bucket) * 0.07 }}
              >
                {/* Column header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.875rem 1.125rem',
                    borderRadius: '12px',
                    background: meta.dimColor,
                    border: `1px solid ${meta.color}33`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{meta.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: meta.color, fontSize: '0.95rem' }}>{meta.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {activeCt}{isFinite(limit) ? `/${limit}` : ''} active
                      </div>
                    </div>
                  </div>
                  {isFinite(limit) && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {Array.from({ length: limit }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: i < activeCt ? meta.color : 'var(--border)',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Track cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {bucketTracks.length === 0 && (
                    <div
                      className="glass"
                      style={{ padding: '1.5rem', textAlign: 'center', border: `1px dashed ${meta.color}33` }}
                    >
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tracks yet</p>
                      <button
                        onClick={() => setShowTrackDrawer(true)}
                        style={{ background: 'none', border: 'none', color: meta.color, cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500 }}
                      >
                        + Add one
                      </button>
                    </div>
                  )}

                  {bucketTracks.map((track) => {
                    const trackPlans = plans.filter((p) => p.trackId === track.id && !p.archived);
                    return (
                      <TrackCard
                        key={track.id}
                        track={track}
                        plans={trackPlans}
                        meta={meta}
                        onStatusChange={handleTrackStatusChange}
                        onPromote={handlePromote}
                        onDelete={handleDeleteTrack}
                        onAddPlan={() => { setSelectedTrackId(track.id); setShowPlanDrawer(true); }}
                        onPlanUpdate={fetchData}
                      />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Track Drawer */}
      <AnimatePresence>
        {showTrackDrawer && (
          <TrackDrawer
            onClose={() => setShowTrackDrawer(false)}
            onSaved={fetchData}
          />
        )}
      </AnimatePresence>

      {/* Plan Drawer */}
      <AnimatePresence>
        {showPlanDrawer && (
          <PlanDrawer
            tracks={tracks}
            preSelectedTrackId={selectedTrackId}
            onClose={() => { setShowPlanDrawer(false); setSelectedTrackId(null); }}
            onSaved={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrackCard
// ─────────────────────────────────────────────────────────────────────────────
function TrackCard({
  track, plans, meta,
  onStatusChange, onPromote, onDelete, onAddPlan, onPlanUpdate,
}: {
  track: Track;
  plans: Plan[];
  meta: typeof BUCKET_META['curiosity'];
  onStatusChange: (id: string, s: Track['status']) => void;
  onPromote: (t: Track) => void;
  onDelete: (id: string) => void;
  onAddPlan: () => void;
  onPlanUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const canPromote = track.bucket !== 'craft';

  const statusColors: Record<Track['status'], string> = {
    active: 'var(--success)',
    paused: 'var(--warning)',
    shelved: 'var(--text-muted)',
  };

  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
      {/* Track header */}
      <div
        style={{
          padding: '1rem 1.125rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: expanded && plans.length > 0 ? '1px solid var(--border)' : 'none',
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[track.status], flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{track.name}</div>
            {track.description && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{track.description}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge" style={{ color: statusColors[track.status], borderColor: statusColors[track.status] + '44', background: statusColors[track.status] + '18', textTransform: 'capitalize' }}>
            {track.status}
          </span>
          {/* 3-dot menu */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px', minWidth: 0 }}
              onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
              id={`track-menu-${track.id}`}
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '0.375rem',
                  zIndex: 20,
                  minWidth: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {track.status !== 'active' && (
                  <MenuBtn label="Set Active" icon="▶" onClick={() => { onStatusChange(track.id, 'active'); setMenuOpen(false); }} />
                )}
                {track.status !== 'paused' && (
                  <MenuBtn label="Pause" icon="⏸" onClick={() => { onStatusChange(track.id, 'paused'); setMenuOpen(false); }} />
                )}
                {track.status !== 'shelved' && (
                  <MenuBtn label="Shelve" icon={<Archive size={13} />} onClick={() => { onStatusChange(track.id, 'shelved'); setMenuOpen(false); }} />
                )}
                {canPromote && (
                  <MenuBtn label="Promote →" icon={<ArrowUpCircle size={13} color={meta.color} />} onClick={() => { onPromote(track); setMenuOpen(false); }} />
                )}
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                <MenuBtn label="Delete" icon={<Trash2 size={13} color="var(--danger)" />} onClick={() => { onDelete(track.id); setMenuOpen(false); }} danger />
              </div>
            )}
          </div>
          <ChevronDown size={14} color="var(--text-muted)" style={{ transform: expanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {/* Plans */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0.75rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} meta={meta} trackId={track.id} onUpdate={onPlanUpdate} />
              ))}
              <button
                onClick={onAddPlan}
                style={{
                  background: 'none', border: `1px dashed ${meta.color}44`,
                  borderRadius: '8px', padding: '0.5rem', color: meta.color,
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}
              >
                <Plus size={13} /> Add Plan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuBtn({ label, icon, onClick, danger }: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 0.625rem', borderRadius: '7px',
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        fontSize: '0.82rem', width: '100%', textAlign: 'left',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ fontSize: '0.75rem' }}>{icon}</span>
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanCard
// ─────────────────────────────────────────────────────────────────────────────
function PlanCard({ plan, meta, trackId, onUpdate }: {
  plan: Plan;
  meta: typeof BUCKET_META['curiosity'];
  trackId: string;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = computePlanProgress(plan.milestones);

  async function toggleMilestone(mIdx: number) {
    const updated = plan.milestones.map((m, i) => (i === mIdx ? { ...m, done: !m.done } : m));
    await fetch('/api/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId, planId: plan.id, updates: { milestones: updated } }),
    });
    onUpdate();
  }

  async function archivePlan() {
    await fetch('/api/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId, planId: plan.id, updates: { archived: true } }),
    });
    onUpdate();
  }

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{ padding: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {plan.title}
          </div>
          {plan.targetDate && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due {formatDate(plan.targetDate)}</div>
          )}
          <div className="progress-track" style={{ marginTop: '0.5rem', height: '4px' }}>
            <div className="progress-fill" style={{ background: meta.color, width: `${pct}%` }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: meta.color, fontFamily: 'Outfit' }}>{pct}%</span>
          <button
            className="btn btn-ghost"
            style={{ padding: '2px', fontSize: '0.65rem', color: 'var(--text-muted)' }}
            onClick={(e) => { e.stopPropagation(); archivePlan(); }}
            title="Archive plan"
          >
            <Archive size={12} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && plan.milestones.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
          >
            <div style={{ padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {plan.milestones.map((m, i) => (
                <label
                  key={m.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '4px 0' }}
                >
                  <div
                    onClick={() => toggleMilestone(i)}
                    style={{
                      width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${m.done ? meta.color : 'var(--border-strong)'}`,
                      background: m.done ? meta.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    {m.done && <Check size={10} color="white" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: m.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: m.done ? 'line-through' : 'none' }}>
                    {m.title}
                  </span>
                  {m.dueDate && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatDate(m.dueDate)}</span>
                  )}
                </label>
              ))}
            </div>
            {plan.linkedResources.length > 0 && (
              <div style={{ padding: '0 0.75rem 0.625rem', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {plan.linkedResources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="badge"
                    style={{ color: meta.color, borderColor: `${meta.color}44`, background: meta.dimColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={9} /> {r.title}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TrackDrawer
// ─────────────────────────────────────────────────────────────────────────────
function TrackDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName]         = useState('');
  const [bucket, setBucket]     = useState<Bucket>('curiosity');
  const [desc, setDesc]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bucket, description: desc }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to create track.'); return; }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return <Drawer title="New Track" onClose={onClose}>
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FormField label="Track Name">
        <input id="track-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AI/ML, Music Production…" />
      </FormField>

      <FormField label="Bucket">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['curiosity', 'project', 'craft'] as Bucket[]).map((b) => {
            const m = BUCKET_META[b];
            return (
              <button key={b} type="button" onClick={() => setBucket(b)} className="btn"
                style={{
                  flex: 1, flexDirection: 'column', gap: '4px', padding: '0.75rem 0.5rem',
                  background: bucket === b ? m.dimColor : 'var(--bg-elevated)',
                  border: `1px solid ${bucket === b ? m.color : 'var(--border)'}`,
                  color: bucket === b ? m.color : 'var(--text-muted)',
                  fontSize: '0.78rem', fontWeight: 600,
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{m.emoji}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField label="Description (optional)">
        <textarea id="track-desc" className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What's this track about?" style={{ resize: 'vertical', fontFamily: 'inherit' }} />
      </FormField>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <button id="track-save-btn" type="submit" disabled={saving} className="btn btn-primary" style={{ justifyContent: 'center', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Creating…' : 'Create Track'}
      </button>
    </form>
  </Drawer>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanDrawer
// ─────────────────────────────────────────────────────────────────────────────
function PlanDrawer({ tracks, preSelectedTrackId, onClose, onSaved }: {
  tracks: Track[];
  preSelectedTrackId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [trackId, setTrackId]   = useState(preSelectedTrackId ?? tracks[0]?.id ?? '');
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [targetDate, setTarget] = useState('');
  const [milestones, setMs]     = useState<Omit<Milestone, 'id'>[]>([{ title: '', done: false }]);
  const [resources, setRs]      = useState<{ title: string; url: string }[]>([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackId || !title.trim()) { setError('Track and title are required.'); return; }
    setSaving(true);
    try {
      const msFilled = milestones.filter((m) => m.title.trim()).map((m, i) => ({ ...m, id: String(i) }));
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, title, description: desc, targetDate: targetDate || undefined, milestones: msFilled, linkedResources: resources.filter((r) => r.url) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const selectedTrack = tracks.find((t) => t.id === trackId);
  const meta = selectedTrack ? BUCKET_META[selectedTrack.bucket] : null;

  return <Drawer title="New Plan" onClose={onClose}>
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FormField label="Track">
        <select id="plan-track-select" className="input select" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
          {tracks.map((t) => (
            <option key={t.id} value={t.id} style={{ background: 'var(--bg-elevated)' }}>
              {BUCKET_META[t.bucket].emoji} {t.name}
            </option>
          ))}
        </select>
      </FormField>

      {meta && <div className="badge" style={{ color: meta.color, borderColor: `${meta.color}44`, background: meta.dimColor, width: 'fit-content' }}>{meta.emoji} {meta.label}</div>}

      <FormField label="Plan Title">
        <input id="plan-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Complete ML Specialization…" />
      </FormField>

      <FormField label="Target Date (optional)">
        <input id="plan-target-date" className="input" type="date" value={targetDate} onChange={(e) => setTarget(e.target.value)} style={{ colorScheme: 'dark' }} />
      </FormField>

      <FormField label="Milestones">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {milestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                className="input"
                value={m.title}
                onChange={(e) => setMs((ms) => ms.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                placeholder={`Milestone ${i + 1}`}
                style={{ flex: 1 }}
              />
              {milestones.length > 1 && (
                <button type="button" onClick={() => setMs((ms) => ms.filter((_, j) => j !== i))} className="btn btn-ghost" style={{ padding: '6px', minWidth: 0, color: 'var(--danger)' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setMs((ms) => [...ms, { title: '', done: false }])}
            style={{ background: 'none', border: `1px dashed ${meta?.color ?? 'var(--border)'}44`, borderRadius: '8px', padding: '0.5rem', color: meta?.color ?? 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
            + Add Milestone
          </button>
        </div>
      </FormField>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <button id="plan-save-btn" type="submit" disabled={saving} className="btn btn-primary" style={{ justifyContent: 'center', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Creating…' : 'Create Plan'}
      </button>
    </form>
  </Drawer>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Drawer wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>{title}</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px', minWidth: 0 }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.625rem', borderRadius: '8px' }}>{children}</p>;
}
