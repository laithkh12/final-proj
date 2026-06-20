import type { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  workspaces: ['workspaces'] as const,
  dashboard: ['dashboard'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  projects: (workspaceId: string) => ['projects', workspaceId] as const,
  activity: (workspaceId: string) => ['activity', workspaceId] as const,
  project: (id: string) => ['project', id] as const,
  projectDetail: (id: string) => ['project', id, 'detail'] as const,
  tasks: (projectId: string) => ['tasks', projectId] as const,
  task: (id: string) => ['task', id] as const,
};

export function invalidateAfterWorkspaceCreate(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.workspaces }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

export function invalidateAfterProjectCreate(qc: QueryClient, workspaceId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) }),
    qc.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) }),
    qc.invalidateQueries({ queryKey: queryKeys.activity(workspaceId) }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

export function invalidateAfterTaskChange(
  qc: QueryClient,
  { projectId, workspaceId, taskId }: { projectId: string; workspaceId: string; taskId?: string }
) {
  const invalidations = [
    qc.invalidateQueries({ queryKey: queryKeys.tasks(projectId) }),
    qc.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
    qc.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) }),
    qc.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) }),
    qc.invalidateQueries({ queryKey: queryKeys.activity(workspaceId) }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ];
  if (taskId) {
    invalidations.push(qc.invalidateQueries({ queryKey: queryKeys.task(taskId) }));
  }
  return Promise.all(invalidations);
}
