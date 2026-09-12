import type { Task } from './task';
import type { FocusSession } from './session';

export interface DailyFocusStat {
  day: string;
  date: string;
  seconds: number;
  minutes: number;
}

export interface SubjectStat {
  subjectId: string | null;
  subjectName: string;
  color: string;
  focusSeconds: number;
  focusMinutes: number;
  focusPercentage: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export interface DashboardData {
  todayFocusSeconds: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  taskCompletionRate: number;
  productivityScore: number;
  weeklyFocus: DailyFocusStat[];
  recentTasks: Task[];
  recentSessions: FocusSession[];
  subjectAnalytics: SubjectStat[];
  dailyFocusGoalMinutes: number;
}
