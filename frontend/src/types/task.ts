export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subject: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  subject: string;
  priority: Priority;
  dueDate: string;
  status?: TaskStatus;
}
