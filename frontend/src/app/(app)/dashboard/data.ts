import {
  CheckSquare,
  FolderKanban,
  LayoutList,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardStats } from '@/types';

export type DashboardStatCard = {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  href: string;
};

export function getDashboardStatCards(stats: DashboardStats): DashboardStatCard[] {
  return [
    {
      label: 'Workspaces',
      value: stats.workspaceCount,
      icon: Users,
      color: 'text-indigo-600',
      href: '/workspaces',
    },
    {
      label: 'Projects',
      value: stats.projectCount,
      icon: FolderKanban,
      color: 'text-purple-600',
      href: '/projects',
    },
    {
      label: 'Total Tasks',
      value: stats.totalTasks,
      icon: CheckSquare,
      color: 'text-blue-600',
      href: '/tasks',
    },
    {
      label: 'Done',
      value: stats.tasksByStatus?.Done || 0,
      icon: LayoutList,
      color: 'text-green-600',
      href: '/tasks',
    },
  ];
}
