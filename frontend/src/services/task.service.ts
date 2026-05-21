import { api } from './api';
import type { ApiResponse, PaginationMeta, Task, TaskPriority, TaskStatus } from '@/types';

export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

export const taskService = {
  list: (projectId: string, params?: TaskListParams) =>
    api.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks`, { params }),
  get: (id: string) => api.get<ApiResponse<Task>>(`/tasks/${id}`),
  create: (projectId: string, data: Partial<Task>) =>
    api.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, data),
  update: (id: string, data: Partial<Task>) =>
    api.patch<ApiResponse<Task>>(`/tasks/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<null>>(`/tasks/${id}`),
};

export type { PaginationMeta };
