import { api } from './api';
import type { InsightsData } from '../types/insights';

export const insightsService = {
  async getInsights(): Promise<InsightsData> {
    return api.get<InsightsData>('/insights');
  },
};
