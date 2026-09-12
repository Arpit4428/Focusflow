export interface CalendarSubjectBreakdown {
  subjectId: string | null;
  subjectName: string;
  color: string;
  focusSeconds: number;
  focusMinutes: number;
  taskCount: number;
}

export interface CalendarTaskSummary {
  id: string;
  title: string;
  subjectId: string | null;
  subject: string;
  color: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'COMPLETED';
}

export interface CalendarSessionSummary {
  id: string;
  subjectId: string | null;
  subject: string;
  color: string;
  duration: number; // in seconds
  startedAt: string;
  endedAt: string;
}

export interface CalendarDayActivity {
  date: string; // YYYY-MM-DD
  totalFocusSeconds: number;
  totalFocusMinutes: number;
  taskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  subjectBreakdown: CalendarSubjectBreakdown[];
  tasks: CalendarTaskSummary[];
  sessions: CalendarSessionSummary[];
}

export interface CalendarResponse {
  year: number;
  month: number;
  activities: CalendarDayActivity[];
}
