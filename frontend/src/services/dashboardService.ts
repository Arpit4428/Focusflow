import { api } from './api';
import type { DashboardData } from '../types/dashboard';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    return api.get<DashboardData>('/dashboard');
  },
};
