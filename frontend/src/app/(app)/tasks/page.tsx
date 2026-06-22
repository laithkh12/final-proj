'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CheckSquare } from 'lucide-react';
import { workspaceService } from '@/services/workspace.service';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import type { Task, TaskStatus } from '@/types';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageBackLink } from '@/components/layout/PageBackLink';
import { cn } from '@/utils/cn';

type TaskWithContext = Task & { projectName: string; projectId: string };

const statusClass: Record<TaskStatus, string> = {
  Todo: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  Review: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  Done: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
};

async function fetchAllTasks(): Promise<TaskWithContext[]> {
  const wsRes = await workspaceService.list();
  const workspaces = wsRes.data.data ?? [];

  const projectsNested = await Promise.all(
    workspaces.map(async (ws) => {
      const res = await projectService.list(ws._id);
      return res.data.data ?? [];
    })
  );
  const projects = projectsNested.flat();

  const tasksNested = await Promise.all(
    projects.map(async (project) => {
      const res = await taskService.list(project._id, { limit: 50 });
      return (res.data.data ?? []).map((task) => ({
        ...task,
        projectName: project.name,
        projectId: project._id,
      }));
    })
  );

  return tasksNested.flat();
}

export default function TasksPage() {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: fetchAllTasks,
  });

  return (
    <div>
      <PageBackLink href="/projects">← Back to projects</PageBackLink>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
        <p className="text-slate-500">All tasks across your projects</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500">Failed to load tasks</p>
      ) : tasks?.length ? (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task._id}>
              <Link
                href={`/tasks/${task._id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.projectName}</p>
                  </div>
                  <span className={cn('shrink-0 rounded px-2 py-1 text-xs', statusClass[task.status])}>
                    {task.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Open a project and create your first task."
          action={
            <Link
              href="/projects"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Go to projects
            </Link>
          }
        />
      )}
    </div>
  );
}
