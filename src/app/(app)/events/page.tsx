'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';
import { AppEvent, Track, Bucket } from '@/types';
import { BUCKET_META } from '@/lib/utils';

type ViewMode = 'week' | 'month';

export default function EventsPage() {
  const [events, setEvents]   = useState<AppEvent[]>([]);
  const [tracks, setTracks]   = useState<Track[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDrawer, setShowDrawer]   = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, tracksRes] = await Promise.all([fetch('/api/events'), fetch('/api/tracks')]);
      setEvents(await eventsRes.json());
      setTracks(await tracksRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return;
    await fetch(`/api/events?eventId=${id}`, { method: 'DELETE' });
    fetchData();
  }

  // Week view helpers
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Month view helpers
  const monthStart  = startOfMonth(currentDate);
  const monthEnd    = endOfMonth(currentDate);
  const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const totalDays = Math.ceil((monthEnd.getDate() + monthGridStart.getDay()) / 7) * 7;
  const monthDays = Array.from({ length: totalDays }, (_, i) => addDays(monthGridStart, i));

  function eventsForDay(day: Date) {
    return events.filter((e) => isSameDay(parseISO(e.start), day));
  }

  function navigate(dir: number) {
    const next = new Date(currentDate);
    if (viewMode === 'week') next.setDate(next.getDate() + dir * 7);
    else next.setMonth(next.getMonth() + dir);
    setCurrentDate(next);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 className="section-title">Event Planner</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Plan sessions and sync with Google Calendar.
          </p>
        </div>
        <button id="add-event-btn" onClick={() => setShowDrawer(true)} className="btn btn-primary">
          <Plus size={16} /> New Event
        </button>
      </motion.div>

      {/* Calendar controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['week', 'month'] as ViewMode[]).map((v) => (
            <button key={v} id={`view-${v}`} onClick={() => setViewMode(v)} className="btn"
              style={{
                background: viewMode === v ? 'var(--project-dim)' : 'transparent',
                color: viewMode === v ? 'var(--project)' : 'var(--text-muted)',
                border: `1px solid ${viewMode === v ? 'var(--project-glow)' : 'var(--border)'}`,
                textTransform: 'capitalize',
              }}>{v}</button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '6px' }}><ChevronLeft size={18} /></button>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', minWidth: '160px', textAlign: 'center' }}>
            {viewMode === 'week'
              ? `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={() => navigate(1)} className="btn btn-ghost" style={{ padding: '6px' }}><ChevronRight size={18} /></button>
          <button onClick={() => setCurrentDate(new Date())} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>Today</button>
        </div>
      </div>

      {/* Calendar grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ overflow: 'hidden' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} style={{ padding: '0.625rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        {viewMode === 'week' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {weekDays.map((day) => <DayCell key={day.toISOString()} day={day} events={eventsForDay(day)} onDelete={deleteEvent} onSelect={setSelectedDay} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {monthDays.map((day) => (
              <DayCell
                key={day.toISOString()} day={day}
                events={eventsForDay(day)} onDelete={deleteEvent} onSelect={setSelectedDay}
                dimmed={day < monthStart || day > monthEnd}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {(['curiosity', 'project', 'craft'] as Bucket[]).map((b) => {
          const meta = BUCKET_META[b];
          return (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color }} />
              {meta.label}
            </div>
          );
        })}
      </div>

      {/* Event Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <EventDrawer
            tracks={tracks}
            preSelectedDate={selectedDay}
            onClose={() => { setShowDrawer(false); setSelectedDay(null); }}
            onSaved={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DayCell({ day, events, onDelete, onSelect, dimmed }: {
  day: Date;
  events: AppEvent[];
  onDelete: (id: string) => void;
  onSelect: (d: Date) => void;
  dimmed?: boolean;
}) {
  const isToday = isSameDay(day, new Date());
  return (
    <div
      style={{
        minHeight: '100px',
        border: '1px solid var(--border)',
        padding: '0.5rem',
        opacity: dimmed ? 0.4 : 1,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onClick={() => onSelect(day)}
      onMouseEnter={(e) => !dimmed && (e.currentTarget.style.background = 'var(--bg-card-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        fontWeight: isToday ? 700 : 400,
        fontSize: '0.8rem',
        color: isToday ? 'var(--project)' : 'var(--text-secondary)',
        marginBottom: '4px',
        ...(isToday && {
          width: 24, height: 24, background: 'var(--project)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
        }),
      }}>
        {format(day, 'd')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {events.slice(0, 3).map((ev) => {
          const meta = ev.bucket ? BUCKET_META[ev.bucket] : null;
          return (
            <div
              key={ev.id}
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${ev.title}"?`)) onDelete(ev.id); }}
              style={{
                fontSize: '0.68rem', fontWeight: 500,
                padding: '2px 5px', borderRadius: '4px',
                background: meta ? `${meta.color}22` : 'var(--bg-elevated)',
                color: meta ? meta.color : 'var(--text-secondary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                cursor: 'pointer', border: `1px solid ${meta ? `${meta.color}33` : 'var(--border)'}`,
              }}
              title={ev.title}
            >
              {ev.title}
            </div>
          );
        })}
        {events.length > 3 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{events.length - 3} more</span>
        )}
      </div>
    </div>
  );
}

function EventDrawer({ tracks, preSelectedDate, onClose, onSaved }: {
  tracks: Track[];
  preSelectedDate: Date | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const defaultDate = preSelectedDate ? format(preSelectedDate, 'yyyy-MM-dd') : '';
  const [title, setTitle]         = useState('');
  const [trackId, setTrackId]     = useState(tracks[0]?.id ?? '');
  const [start, setStart]         = useState(defaultDate ? `${defaultDate}T09:00` : '');
  const [end, setEnd]             = useState(defaultDate ? `${defaultDate}T10:00` : '');
  const [desc, setDesc]           = useState('');
  const [allDay, setAllDay]       = useState(false);
  const [pushToGCal, setPush]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const selectedTrack = tracks.find((t) => t.id === trackId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !start) { setError('Title and start time are required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, trackId: trackId || undefined,
          bucket: selectedTrack?.bucket,
          start: allDay ? start.split('T')[0] : start,
          end: allDay ? (end.split('T')[0] || start.split('T')[0]) : (end || start),
          description: desc, allDay, pushToCalendar: pushToGCal,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed'); return; }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const meta = selectedTrack ? BUCKET_META[selectedTrack.bucket] : null;

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
        style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}><Calendar size={16} style={{ display: 'inline', marginRight: 8 }} />New Event</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px', minWidth: 0 }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Title</label>
              <input id="event-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Music practice session" />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Track (optional)</label>
              <select id="event-track" className="input select" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
                <option value="">— No track —</option>
                {tracks.map((t) => <option key={t.id} value={t.id} style={{ background: 'var(--bg-elevated)' }}>{BUCKET_META[t.bucket].emoji} {t.name}</option>)}
              </select>
              {meta && <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                <span style={{ fontSize: '0.72rem', color: meta.color }}>{meta.label}</span>
              </div>}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <input id="event-allday" type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} style={{ accentColor: 'var(--project)' }} />
              All-day event
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Start</label>
                <input id="event-start" className="input" type={allDay ? 'date' : 'datetime-local'} value={start} onChange={(e) => setStart(e.target.value)} style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>End</label>
                <input id="event-end" className="input" type={allDay ? 'date' : 'datetime-local'} value={end} onChange={(e) => setEnd(e.target.value)} style={{ colorScheme: 'dark' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>Notes (optional)</label>
              <textarea id="event-desc" className="input" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <label
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem', borderRadius: '10px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '0.85rem' }}>📅 Push to Google Calendar</span>
              <input id="event-gcal-toggle" type="checkbox" checked={pushToGCal} onChange={(e) => setPush(e.target.checked)} style={{ accentColor: 'var(--project)', width: 16, height: 16 }} />
            </label>

            {error && <p style={{ fontSize: '0.8rem', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.625rem', borderRadius: '8px' }}>{error}</p>}

            <button id="event-save-btn" type="submit" disabled={saving} className="btn btn-primary" style={{ justifyContent: 'center', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Create Event'}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
