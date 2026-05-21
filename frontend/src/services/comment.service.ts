import { api } from './api';
import type { ApiResponse, Comment } from '@/types';

export const commentService = {
  list: (taskId: string) => api.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments`),
  create: (taskId: string, content: string) =>
    api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, { content }),
  remove: (id: string) => api.delete<ApiResponse<null>>(`/comments/${id}`),
};
