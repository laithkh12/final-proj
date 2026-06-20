'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isReady = useAuthStore((s) => s.isReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (isReady && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isReady, isLoading, isAuthenticated, router]);

  if (!isReady || isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
