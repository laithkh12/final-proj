import { api } from './api';
import type { ApiResponse, MemberRole, Project } from '@/types';

export const projectService = {
  list: (workspaceId: string) =>
    api.get<ApiResponse<Project[]>>(`/workspaces/${workspaceId}/projects`),
  get: (id: string) =>
    api.get<ApiResponse<{ project: Project; taskStats: unknown[]; myRole: MemberRole }>>(`/projects/${id}`),
  create: (workspaceId: string, data: { name: string; description?: string; color?: string }) =>
    api.post<ApiResponse<Project>>(`/workspaces/${workspaceId}/projects`, data),
  update: (id: string, data: Partial<Project>) =>
    api.patch<ApiResponse<Project>>(`/projects/${id}`, data),
  remove: (id: string) => api.delete<ApiResponse<null>>(`/projects/${id}`),
};
