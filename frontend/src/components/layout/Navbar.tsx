'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Moon, Sun, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const showAvatar = user?.avatar && !avatarError;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 font-bold text-indigo-600"
        >
          <LayoutDashboard className="h-6 w-6" />
          <span>TeamFlow</span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {showAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{user?.name}</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
