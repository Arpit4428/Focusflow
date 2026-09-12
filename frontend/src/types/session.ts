export interface FocusSession {
  id: string;
  userId: string;
  subjectId?: string;
  subject: string;
  duration: number; // in seconds
  startedAt: string;
  endedAt: string;
  completed: boolean;
}

export interface FocusSessionRequest {
  subjectId?: string;
  subject?: string;
  duration: number; // in seconds
  startedAt: string;
  endedAt: string;
  completed: boolean;
}
