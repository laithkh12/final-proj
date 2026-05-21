'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const getToken = useAuthStore((s) => s.getToken);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    if (!hasHydrated) return;

    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    if (!isAuthenticated && !isLoading) {
      fetchUser();
    }
  }, [hasHydrated, isAuthenticated, isLoading, getToken, fetchUser, router]);

  if (!hasHydrated) {
    return <LoadingScreen />;
  }

  const token = getToken();
  if (!token) {
    return <LoadingScreen />;
  }

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
