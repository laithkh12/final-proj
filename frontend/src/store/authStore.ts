import { create } from 'zustand';
import axios from 'axios';
import type { User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  setAuth: (user: User) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isReady: false,

  setAuth: (user) => {
    set({ user, isAuthenticated: true, isLoading: false, isReady: true });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    set({ user: null, isAuthenticated: false, isLoading: false, isReady: true });
  },

  initialize: async () => {
    if (get().isReady) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      if (get().isAuthenticated && get().user) {
        set({ isLoading: false, isReady: true });
        return;
      }

      set({ isLoading: true });
      try {
        const res = await authService.getMe();
        set({
          user: res.data.data!,
          isAuthenticated: true,
          isLoading: false,
          isReady: true,
        });
      } catch (error) {
        const isUnauthorized =
          axios.isAxiosError(error) && error.response?.status === 401;
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isReady: true,
        });
        if (!isUnauthorized) {
          console.error('Failed to restore session', error);
        }
      }
    })();

    return initPromise;
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      initPromise = null;
      get().clearAuth();
    }
  },
}));

if (typeof window !== 'undefined') {
  localStorage.removeItem('teamflow_token');
  localStorage.removeItem('teamflow-auth');
}
