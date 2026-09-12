import { api } from './api';
import type { Task, TaskRequest, TaskStatus, Priority } from '../types/task';

export const taskService = {
  async getTasks(status?: TaskStatus, priority?: Priority): Promise<Task[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return api.get<Task[]>(`/tasks${queryString}`);
  },

  async getTaskById(id: string): Promise<Task> {
    return api.get<Task>(`/tasks/${id}`);
  },

  async createTask(data: TaskRequest): Promise<Task> {
    return api.post<Task>('/tasks', data);
  },

  async updateTask(id: string, data: TaskRequest): Promise<Task> {
    return api.put<Task>(`/tasks/${id}`, data);
  },

  async deleteTask(id: string): Promise<void> {
    return api.delete<void>(`/tasks/${id}`);
  },

  async toggleComplete(id: string): Promise<Task> {
    return api.patch<Task>(`/tasks/${id}/complete`);
  },
};
