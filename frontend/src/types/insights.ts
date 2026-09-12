export interface SubjectStat {
  subject: string;
  durationSeconds: number;
  minutes: number;
  percentage: number;
}

export interface DayOfWeekStat {
  dayOfWeek: string;
  durationSeconds: number;
  sessionCount: number;
}

export interface Recommendation {
  type: 'SUCCESS' | 'WARNING' | 'INFO';
  title: string;
  message: string;
}

export interface InsightsData {
  totalFocusSeconds: number;
  averageSessionDurationSeconds: number;
  totalSessions: number;
  mostFocusedSubject: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  taskCompletionRate: number;
  mostProductiveDayOfWeek: string;
  activeDaysLast7Days: number;
  weeklyFocusSeconds: number;
  subjectBreakdown: SubjectStat[];
  dayOfWeekBreakdown: DayOfWeekStat[];
  recommendations: Recommendation[];
}
