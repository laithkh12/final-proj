import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User } from '@/types';
import { authService } from '@/services/auth.service';

import { TOKEN_KEY } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      getToken: () => {
        if (typeof window === 'undefined') return get().token;
        return get().token || localStorage.getItem(TOKEN_KEY);
      },

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, token);
        }
        set({ user, token, isAuthenticated: true, isLoading: false });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
        }
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      fetchUser: async () => {
        const token = get().getToken();
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        if (!get().token && typeof window !== 'undefined') {
          set({ token });
        }

        set({ isLoading: true });
        try {
          const res = await authService.getMe();
          set({
            user: res.data.data!,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const isUnauthorized =
            axios.isAxiosError(error) && error.response?.status === 401;
          if (isUnauthorized) {
            get().clearAuth();
          } else {
            set({ isLoading: false });
          }
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          get().clearAuth();
        }
      },
    }),
    {
      name: 'teamflow-auth',
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, state.token);
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  const finishHydration = () => {
    useAuthStore.setState({ hasHydrated: true });
    const { token, isAuthenticated, fetchUser } = useAuthStore.getState();
    if (token && isAuthenticated) {
      fetchUser();
    } else if (token) {
      fetchUser();
    }
  };

  if (useAuthStore.persist.hasHydrated()) {
    finishHydration();
  } else {
    useAuthStore.persist.onFinishHydration(finishHydration);
  }
}
