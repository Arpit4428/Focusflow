import { api } from './api';
import type { CalendarResponse } from '../types/calendar';

export const calendarService = {
  async getCalendarActivity(year?: number, month?: number): Promise<CalendarResponse> {
    const params = new URLSearchParams();
    if (year !== undefined) params.append('year', year.toString());
    if (month !== undefined) params.append('month', month.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<CalendarResponse>(`/calendar${query}`);
  },
};
