import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Persona — Personal Progress Tracker',
  description:
    'Track your Curiosity explorations, active Projects, and long-term Craft mastery in one beautifully organized place.',
  keywords: ['progress tracker', 'habit tracker', 'study tracker', 'personal growth'],
  authors: [{ name: 'Persona' }],
  openGraph: {
    title: 'Persona — Personal Progress Tracker',
    description: 'Your 3-level interest system for mastering curiosity, projects, and craft.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
