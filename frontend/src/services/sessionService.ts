import { api } from './api';
import type { FocusSession, FocusSessionRequest } from '../types/session';

export const sessionService = {
  async getSessions(subject?: string): Promise<FocusSession[]> {
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return api.get<FocusSession[]>(`/focus-sessions${query}`);
  },

  async getSessionById(id: string): Promise<FocusSession> {
    return api.get<FocusSession>(`/focus-sessions/${id}`);
  },

  async createSession(data: FocusSessionRequest): Promise<FocusSession> {
    return api.post<FocusSession>('/focus-sessions', data);
  },

  async deleteSession(id: string): Promise<void> {
    return api.delete<void>(`/focus-sessions/${id}`);
  },
};
