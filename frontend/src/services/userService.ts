import { api } from './api';
import type { UserPreferencesRequest, UserPreferencesResponse } from '../types/user';

export const userService = {
  async updatePreferences(preferences: UserPreferencesRequest): Promise<UserPreferencesResponse> {
    return api.put<UserPreferencesResponse>('/users/me/preferences', preferences);
  },

  async getPreferences(): Promise<UserPreferencesResponse> {
    return api.get<UserPreferencesResponse>('/users/me/preferences');
  },
};
