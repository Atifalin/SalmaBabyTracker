export interface Child {
  id: string;
  name: string;
  avatar: string;
  birthDate: string;
  themeColor: string;
  createdAt: string;
}

export type RecurrenceType = 'once-daily' | 'multiple-daily' | 'every-x-hours' | 'custom-days';

// 'lenient' = any log that day counts as fully done (e.g. diaper, feeding)
// 'strict'  = must complete the full expected count for full credit (e.g. Calcium 2x)
export type ScoringMode = 'lenient' | 'strict';

export interface Task {
  id: string;
  childId: string;
  title: string;
  icon: string;
  color: string;
  recurrenceType: RecurrenceType;
  timesPerDay?: number;
  hoursInterval?: number;
  customDays?: number[];
  reminderTime?: string;
  pointValue: number;
  scoringMode?: ScoringMode;
  createdAt: string;
  archivedAt?: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  childId: string;
  completedAt: string;
  points: number;
}

export interface DayStats {
  date: string;
  childId: string;
  stars: number;
  completedTasks: number;
  totalTasks: number;
  points: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface ChildBadge {
  childId: string;
  badgeId: string;
  unlockedAt: string;
}

export interface Streak {
  childId: string;
  taskId?: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
}
