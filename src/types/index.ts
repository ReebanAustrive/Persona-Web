export type Bucket = 'curiosity' | 'project' | 'craft';
export type TrackStatus = 'active' | 'paused' | 'shelved';

export interface PromotionHistory {
  from: Bucket;
  to: Bucket;
  date: string; // ISO
}

export interface Track {
  id: string;
  name: string;
  bucket: Bucket;
  status: TrackStatus;
  description?: string;
  color?: string; // user-customisable accent override
  promotionHistory: PromotionHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
}

export interface LinkedResource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'book' | 'course' | 'other';
}

export interface Plan {
  id: string;
  trackId: string;
  title: string;
  description?: string;
  targetDate?: string;
  milestones: Milestone[];
  linkedResources: LinkedResource[];
  progressPct: number; // 0-100, auto-computed from milestones
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  trackId: string;
  planId?: string;
  title: string;
  dueDate?: string;
  done: boolean;
  recurrence?: 'daily' | 'weekly' | null;
  createdAt: string;
}

export interface ProgressEntry {
  trackId: string;
  bucket: Bucket;
  minutesLogged: number;
  notes?: string;
  completionPct: number; // 0-100
}

export interface ProgressLog {
  id: string; // date string YYYY-MM-DD
  userId: string;
  date: string;
  entries: ProgressEntry[];
}

export interface AppEvent {
  id: string;
  title: string;
  trackId?: string;
  bucket?: Bucket;
  start: string; // ISO
  end: string;   // ISO
  allDay?: boolean;
  description?: string;
  googleCalendarEventId?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  joinedAt: string;
  currentStreak: number;
  longestStreak: number;
  lastLogDate?: string;
  achievements: Achievement[];
  weeklyConsistencyPct: number;
}
