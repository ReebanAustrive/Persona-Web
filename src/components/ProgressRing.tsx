'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface ProgressRingProps {
  pct: number;       // 0-100
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  sublabel?: string;
  glowColor?: string;
}

export default function ProgressRing({
  pct,
  size = 120,
  strokeWidth = 8,
  color,
  label,
  sublabel,
  glowColor,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const motionPct = useMotionValue(0);
  const dashOffset = useTransform(motionPct, (v) => circumference - (v / 100) * circumference);
  const displayPct = useMotionValue(0);

  useEffect(() => {
    const c1 = animate(motionPct, pct, { duration: 1.2, ease: 'easeOut' });
    const c2 = animate(displayPct, pct, { duration: 1.2, ease: 'easeOut' });
    return () => { c1.stop(); c2.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  const RoundedDisplayPct = useTransform(displayPct, Math.round);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Glow effect */}
        {glowColor && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              boxShadow: `0 0 32px ${glowColor}`,
              opacity: pct > 0 ? 0.5 : 0,
              transition: 'opacity 0.6s ease',
              pointerEvents: 'none',
            }}
          />
        )}

        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>

        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <motion.span
            style={{
              fontSize: size > 100 ? '1.4rem' : '1rem',
              fontWeight: 700,
              color,
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            <motion.span>{RoundedDisplayPct}</motion.span>%
          </motion.span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
