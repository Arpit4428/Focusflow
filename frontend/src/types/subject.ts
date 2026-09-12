export interface Subject {
  id: string;
  userId: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectRequest {
  name: string;
  color?: string;
  description?: string;
}
