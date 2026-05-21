import { api } from './api';
import type {
  ActivityLog,
  ApiResponse,
  DashboardStats,
  PaginationMeta,
  Workspace,
  WorkspaceMember,
} from '@/types';

export const workspaceService = {
  list: () => api.get<ApiResponse<Workspace[]>>('/workspaces'),
  get: (id: string) =>
    api.get<
      ApiResponse<{
        workspace: Workspace;
        members: WorkspaceMember[];
        stats: { projectCount: number; taskCount: number };
      }>
    >(`/workspaces/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<ApiResponse<Workspace>>('/workspaces', data),
  update: (id: string, data: Partial<Workspace>) =>
    api.patch<ApiResponse<Workspace>>(`/workspaces/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<null>>(`/workspaces/${id}`),
  invite: (id: string, data: { email: string; role?: string }) =>
    api.post<ApiResponse<WorkspaceMember>>(`/workspaces/${id}/members`, data),
  activity: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<ActivityLog[]>>(`/workspaces/${id}/activity`, { params }),
  dashboard: () => api.get<ApiResponse<DashboardStats>>('/workspaces/dashboard/stats'),
};

export type { PaginationMeta };
