import axios, { AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status !== 401 || typeof window === 'undefined') {
      return Promise.reject(error);
    }

    const url = error.config?.url ?? '';
    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/me');

    if (!isAuthRequest) {
      void import('@/store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().clearAuth();
      });
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Something went wrong';
  }
  return 'Something went wrong';
};
