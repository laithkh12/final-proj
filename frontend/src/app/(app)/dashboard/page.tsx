'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { CheckSquare, FolderKanban, LayoutList, Users } from 'lucide-react';
import { workspaceService } from '@/services/workspace.service';
import { CardSkeleton } from '@/components/ui/Skeleton';

const statusColors: Record<string, string> = {
  Todo: 'bg-slate-500',
  'In Progress': 'bg-blue-500',
  Review: 'bg-amber-500',
  Done: 'bg-green-500',
};

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await workspaceService.dashboard();
      return res.data.data!;
    },
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Failed to load dashboard</p>;
  }

  const stats = data!;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
      <p className="mb-6 text-slate-500">Overview of your workspaces, projects, and tasks</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Workspaces', value: stats.workspaceCount, icon: Users, color: 'text-indigo-600' },
          { label: 'Projects', value: stats.projectCount, icon: FolderKanban, color: 'text-purple-600' },
          { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-blue-600' },
          {
            label: 'Done',
            value: stats.tasksByStatus?.Done || 0,
            icon: LayoutList,
            color: 'text-green-600',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <card.icon className={`mb-2 h-5 w-5 ${card.color}`} />
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Tasks by status</h2>
          <div className="space-y-3">
            {['Todo', 'In Progress', 'Review', 'Done'].map((status) => {
              const count = stats.tasksByStatus?.[status] || 0;
              const pct = stats.totalTasks ? (count / stats.totalTasks) * 100 : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${statusColors[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold">Recent activity</h2>
          {stats.recentActivity?.length ? (
            <ul className="space-y-3">
              {stats.recentActivity.map((log) => (
                <li key={log._id} className="text-sm">
                  <p className="text-slate-800 dark:text-slate-200">{log.message}</p>
                  <p className="text-xs text-slate-400">
                    {typeof log.user === 'object' ? log.user.name : 'User'} ·{' '}
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No recent activity</p>
          )}
          <Link href="/workspaces" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            View workspaces →
          </Link>
        </div>
      </div>
    </div>
  );
}
