'use client';

import dynamic from 'next/dynamic';

// Disable SSR entirely — this is a pure client-side auth page.
// This prevents React hydration mismatches caused by browser extensions
// (e.g. Dark Reader) that inject attributes into inline-styled elements
// before React can hydrate.
const LoginClient = dynamic(() => import('./LoginClient'), { ssr: false });

export default function LoginPage() {
  return <LoginClient />;
}
