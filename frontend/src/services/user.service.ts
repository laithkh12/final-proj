import { api } from './api';
import type { ApiResponse, User } from '@/types';

export const userService = {
  getMe: () => api.get<ApiResponse<User>>('/users/me'),
  updateMe: (data: Partial<User>) => api.patch<ApiResponse<User>>('/users/me', data),
};
