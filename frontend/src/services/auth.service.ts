import { api } from './api';
import type { ApiResponse, AuthResponse, User } from '@/types';

export const authService = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
};
