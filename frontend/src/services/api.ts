import axios, { AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

function getApiBaseUrl(): string {
  // Browser always uses same-origin /api (Vercel rewrite → Render in prod, Next proxy in dev)
  if (typeof window !== 'undefined') {
    return '/api';
  }

  const proxy = process.env.API_PROXY_URL?.replace(/\/$/, '');
  if (proxy) {
    return `${proxy}/api`;
  }

  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
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
