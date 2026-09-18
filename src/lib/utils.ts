import { Bucket } from '@/types';

export const BUCKET_META: Record<Bucket, { label: string; color: string; dimColor: string; glowColor: string; emoji: string }> = {
  curiosity: {
    label: 'Curiosity',
    color: 'var(--curiosity)',
    dimColor: 'var(--curiosity-dim)',
    glowColor: 'var(--curiosity-glow)',
    emoji: '✨',
  },
  project: {
    label: 'Projects',
    color: 'var(--project)',
    dimColor: 'var(--project-dim)',
    glowColor: 'var(--project-glow)',
    emoji: '⚡',
  },
  craft: {
    label: 'Craft',
    color: 'var(--craft)',
    dimColor: 'var(--craft-dim)',
    glowColor: 'var(--craft-glow)',
    emoji: '💎',
  },
};

export function getBucketClass(bucket: Bucket) {
  return {
    curiosity: 'bg-bucket-curiosity bucket-curiosity',
    project: 'bg-bucket-project bucket-project',
    craft: 'bg-bucket-craft bucket-craft',
  }[bucket];
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function computePlanProgress(milestones: { done: boolean }[]): number {
  if (!milestones.length) return 0;
  const done = milestones.filter((m) => m.done).length;
  return Math.round((done / milestones.length) * 100);
}
