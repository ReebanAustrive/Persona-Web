'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function LoginClient() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass"
        style={{
          padding: '3rem',
          maxWidth: '420px',
          width: '90%',
          textAlign: 'center',
        }}
      >
        {/* Logo / wordmark */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, var(--project) 0%, var(--craft) 100%)',
              margin: '0 auto 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            ✦
          </div>
          <h1
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Persona
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Your 3-level system for mastering what matters.
          </p>
        </div>

        {/* Bucket pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            marginBottom: '2.5rem',
          }}
        >
          {[
            { label: 'Curiosity', color: 'var(--curiosity)' },
            { label: 'Projects', color: 'var(--project)' },
            { label: 'Craft', color: 'var(--craft)' },
          ].map((b) => (
            <span
              key={b.label}
              style={{
                padding: '4px 12px',
                borderRadius: '99px',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: b.color,
                background: `${b.color}22`,
                border: `1px solid ${b.color}44`,
                letterSpacing: '0.05em',
              }}
            >
              {b.label}
            </span>
          ))}
        </div>

        {/* Sign in button */}
        <motion.button
          id="google-signin-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-strong)',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'all 0.15s ease',
          }}
        >
          {/* Google G */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </motion.button>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
          <br />
          Calendar access is used only for syncing your Persona events.
        </p>
      </motion.div>
    </main>
  );
}
