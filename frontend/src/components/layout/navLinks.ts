import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

export const primaryNavLinks: NavLink[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/dashboard',
  },
  {
    href: '/workspaces',
    label: 'Workspaces',
    icon: Users,
    match: (pathname) =>
      pathname === '/workspaces' || /^\/workspaces\/[^/]+$/.test(pathname),
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: FolderKanban,
    match: (pathname) => pathname === '/projects' || /^\/projects\/[^/]+$/.test(pathname),
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: CheckSquare,
    match: (pathname) => pathname === '/tasks' || /^\/tasks\/[^/]+$/.test(pathname),
  },
];
