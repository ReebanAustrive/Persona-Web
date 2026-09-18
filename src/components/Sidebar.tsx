'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Gem,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/career',    label: 'Career',    icon: Briefcase },
  { href: '/events',   label: 'Events',    icon: CalendarDays },
  { href: '/chat',     label: 'AI Chat',   icon: MessageSquare },
  { href: '/profile',  label: 'Profile',   icon: User },
];

const BUCKET_ICONS = [
  { icon: Sparkles, label: 'Curiosity', color: 'var(--curiosity)' },
  { icon: Zap,      label: 'Projects',  color: 'var(--project)' },
  { icon: Gem,      label: 'Craft',     color: 'var(--craft)' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      suppressHydrationWarning
      style={{
        height: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        suppressHydrationWarning
        style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          minHeight: '64px',
        }}
      >
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--project) 0%, var(--craft) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                Persona
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--project) 0%, var(--craft) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              margin: '0 auto',
            }}
          >
            ✦
          </div>
        )}

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="btn-ghost btn"
            style={{ padding: '4px', borderRadius: '8px', minWidth: 0 }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Bucket legend */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            suppressHydrationWarning
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            {BUCKET_ICONS.map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                title={label}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 4px',
                  borderRadius: '8px',
                  background: `${color}18`,
                  border: `1px solid ${color}30`,
                }}
              >
                <Icon size={14} color={color} />
                <span style={{ fontSize: '0.6rem', color, fontWeight: 600, letterSpacing: '0.04em' }}>
                  {label.substring(0, 3).toUpperCase()}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: collapsed ? '0.625rem' : '0.625rem 0.875rem',
                borderRadius: '10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'var(--bg-card-hover)' : 'transparent',
                border: `1px solid ${active ? 'var(--border-strong)' : 'transparent'}`,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + expand */}
      <div
        suppressHydrationWarning
        style={{
          padding: '0.75rem 0.625rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="btn-ghost btn"
            style={{ padding: '0.625rem', borderRadius: '10px', justifyContent: 'center', width: '100%' }}
            aria-label="Expand sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* User avatar + sign out */}
        {session?.user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--project-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                }}
              >
                {session.user.name?.[0] ?? '?'}
              </div>
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {session.user.name}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <LogOut size={11} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
