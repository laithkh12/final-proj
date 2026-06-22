'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import { workspaceService } from '@/services/workspace.service';
import { projectService } from '@/services/project.service';
import type { Project } from '@/types';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageBackLink } from '@/components/layout/PageBackLink';

type ProjectWithWorkspace = Project & { workspaceName: string };

async function fetchAllProjects(): Promise<ProjectWithWorkspace[]> {
  const wsRes = await workspaceService.list();
  const workspaces = wsRes.data.data ?? [];

  const nested = await Promise.all(
    workspaces.map(async (ws) => {
      const res = await projectService.list(ws._id);
      return (res.data.data ?? []).map((project) => ({
        ...project,
        workspaceName: ws.name,
      }));
    })
  );

  return nested.flat();
}

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['all-projects'],
    queryFn: fetchAllProjects,
  });

  return (
    <div>
      <PageBackLink href="/workspaces">← Back to workspaces</PageBackLink>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
        <p className="text-slate-500">All projects across your workspaces</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-500">Failed to load projects</p>
      ) : projects?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/projects/${project._id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
              style={{ borderTopColor: project.color, borderTopWidth: 3 }}
            >
              <FolderKanban className="mb-2 h-5 w-5" style={{ color: project.color }} />
              <h3 className="font-semibold text-slate-900 dark:text-white">{project.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{project.workspaceName}</p>
              <p className="mt-1 text-xs text-slate-400">{project.taskCount ?? 0} tasks</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a workspace first, then add a project from there."
          action={
            <Link
              href="/workspaces"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Go to workspaces
            </Link>
          }
        />
      )}
    </div>
  );
}
