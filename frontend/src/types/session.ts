export interface FocusSession {
  id: string;
  userId: string;
  subject: string;
  duration: number; // in seconds
  startedAt: string;
  endedAt: string;
  completed: boolean;
}

export interface FocusSessionRequest {
  subject: string;
  duration: number; // in seconds
  startedAt: string;
  endedAt: string;
  completed: boolean;
}
