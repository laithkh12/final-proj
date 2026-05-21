'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './QueryProvider';
import { useThemeStore } from '@/store/themeStore';

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeInitializer>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </ThemeInitializer>
    </QueryProvider>
  );
}
