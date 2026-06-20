'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { CheckSquare, FolderKanban, LayoutList, Sparkles, Users } from 'lucide-react';
import { workspaceService } from '@/services/workspace.service';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { AiAssistantPanel } from '@/components/ai/AiAssistantPanel';

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
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500">Overview of your workspaces, projects, and tasks</p>
      </div>

      <div className="mb-8 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 p-5 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-purple-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">AI Project Planner</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                Start from here to generate workspaces, projects, and tasks with priorities and
                assignees — all from one conversation.
              </p>
            </div>
          </div>
          <AiAssistantPanel label="Open AI Planner" />
        </div>
      </div>

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

      <div className="mt-8 flex justify-center">
        <AiAssistantPanel label="Plan with AI" />
      </div>
    </div>
  );
}
