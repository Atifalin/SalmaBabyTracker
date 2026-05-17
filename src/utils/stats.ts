import { Task, TaskCompletion, ScoringMode } from '../types';
import { toDateKey } from './date';

export function expectedDailyCount(task: Task): number {
  switch (task.recurrenceType) {
    case 'multiple-daily':
      return Math.max(1, task.timesPerDay ?? 2);
    case 'every-x-hours':
      return Math.max(1, Math.floor(24 / (task.hoursInterval ?? 6)));
    case 'custom-days':
      return 1;
    case 'once-daily':
    default:
      return 1;
  }
}

export function isTaskActiveOn(task: Task, date: Date): boolean {
  const dateKey = toDateKey(date);
  const createdKey = toDateKey(task.createdAt);
  // Task must have been created on or before this date
  if (createdKey > dateKey) return false;
  // If archived, exclude from the day of archival onwards (so deleting hides from today too)
  if (task.archivedAt) {
    const archivedKey = toDateKey(task.archivedAt);
    if (dateKey >= archivedKey) return false;
  }
  return true;
}

export function isTaskScheduledOn(task: Task, date: Date): boolean {
  if (!isTaskActiveOn(task, date)) return false;
  if (task.recurrenceType === 'custom-days') {
    return task.customDays?.includes(date.getDay()) ?? false;
  }
  return true;
}

export function tasksScheduledOn(tasks: Task[], childId: string, date: Date): Task[] {
  return tasks.filter((t) => t.childId === childId && isTaskScheduledOn(t, date));
}

export function activeTasks(tasks: Task[], childId: string): Task[] {
  return tasks.filter((t) => t.childId === childId && !t.archivedAt);
}

export function defaultScoringMode(task: Pick<Task, 'recurrenceType'>): ScoringMode {
  // High-frequency / variable tasks default to lenient (any log = done)
  if (task.recurrenceType === 'multiple-daily' || task.recurrenceType === 'every-x-hours') {
    return 'lenient';
  }
  return 'strict';
}

export function effectiveScoringMode(task: Task): ScoringMode {
  return task.scoringMode ?? defaultScoringMode(task);
}

export function dayCompletionRatio(
  tasks: Task[],
  completions: TaskCompletion[],
  childId: string,
  date: Date,
): { completed: number; total: number; ratio: number } {
  const dateKey = toDateKey(date);
  const scheduled = tasksScheduledOn(tasks, childId, date);
  let total = 0;
  let completed = 0;
  scheduled.forEach((task) => {
    const expected = expectedDailyCount(task);
    const done = completions.filter(
      (c) => c.taskId === task.id && c.childId === childId && toDateKey(c.completedAt) === dateKey,
    ).length;
    if (effectiveScoringMode(task) === 'lenient') {
      // contributes a single 0/1 unit to the day's score
      total += 1;
      completed += done > 0 ? 1 : 0;
    } else {
      total += expected;
      completed += Math.min(done, expected);
    }
  });
  const ratio = total === 0 ? 0 : completed / total;
  return { completed, total, ratio };
}

export function starsForRatio(ratio: number): number {
  if (ratio >= 1) return 5;
  if (ratio >= 0.8) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.4) return 2;
  if (ratio > 0) return 1;
  return 0;
}

export function currentStreak(
  tasks: Task[],
  completions: TaskCompletion[],
  childId: string,
): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const { ratio, total } = dayCompletionRatio(tasks, completions, childId, d);
    if (total === 0) {
      if (i === 0) continue;
      break;
    }
    if (ratio >= 0.6) {
      streak += 1;
    } else if (i === 0) {
      // today not yet complete; don't penalize
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (ctx: BadgeContext) => boolean;
}

export interface BadgeContext {
  tasks: Task[];
  completions: TaskCompletion[];
  childId: string;
  streak: number;
  totalPoints: number;
  perfectDays: number;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first-perfect',
    name: 'First Perfect Day',
    description: 'Completed every task in a day',
    icon: '🌟',
    check: (c) => c.perfectDays >= 1,
  },
  {
    id: 'streak-3',
    name: '3 Day Glow',
    description: 'Kept the routine for 3 days',
    icon: '✨',
    check: (c) => c.streak >= 3,
  },
  {
    id: 'streak-7',
    name: '7 Day Streak',
    description: 'A whole week of consistency',
    icon: '🔥',
    check: (c) => c.streak >= 7,
  },
  {
    id: 'streak-30',
    name: '30 Day Consistency',
    description: 'A full month of love',
    icon: '🏆',
    check: (c) => c.streak >= 30,
  },
  {
    id: 'points-100',
    name: 'Hundred Hearts',
    description: 'Earned 100 points',
    icon: '💛',
    check: (c) => c.totalPoints >= 100,
  },
  {
    id: 'points-500',
    name: 'Caretaker Hero',
    description: 'Earned 500 points',
    icon: '🦸',
    check: (c) => c.totalPoints >= 500,
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: '7 perfect days in a row',
    icon: '🌈',
    check: (c) => c.streak >= 7 && c.perfectDays >= 7,
  },
  {
    id: 'night-owl',
    name: 'Night Owl Parent',
    description: 'Logged a task after midnight',
    icon: '🦉',
    check: (c) =>
      c.completions.some((x) => {
        const h = new Date(x.completedAt).getHours();
        return h >= 0 && h < 5 && x.childId === c.childId;
      }),
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Logged a task before 7am',
    icon: '🐦',
    check: (c) =>
      c.completions.some((x) => {
        const h = new Date(x.completedAt).getHours();
        return h >= 5 && h < 7 && x.childId === c.childId;
      }),
  },
];

export function countPerfectDays(
  tasks: Task[],
  completions: TaskCompletion[],
  childId: string,
  daysBack = 60,
): number {
  let count = 0;
  const today = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const { ratio, total } = dayCompletionRatio(tasks, completions, childId, d);
    if (total > 0 && ratio >= 1) count++;
  }
  return count;
}
