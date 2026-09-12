import { api } from './api';
import type { Subject, SubjectRequest } from '../types/subject';

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    return api.get<Subject[]>('/subjects');
  },

  async getSubjectById(id: string): Promise<Subject> {
    return api.get<Subject>(`/subjects/${id}`);
  },

  async createSubject(data: SubjectRequest): Promise<Subject> {
    return api.post<Subject>('/subjects', data);
  },

  async updateSubject(id: string, data: SubjectRequest): Promise<Subject> {
    return api.put<Subject>(`/subjects/${id}`, data);
  },

  async deleteSubject(id: string): Promise<void> {
    return api.delete<void>(`/subjects/${id}`);
  },
};
