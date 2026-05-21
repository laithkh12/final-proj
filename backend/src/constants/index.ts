export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export const TASK_STATUSES = ['Todo', 'In Progress', 'Review', 'Done'] as const;
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export const MEMBER_ROLES = ['owner', 'admin', 'member'] as const;

export const ACTIVITY_TYPES = [
  'workspace_created',
  'workspace_updated',
  'workspace_deleted',
  'member_invited',
  'member_removed',
  'project_created',
  'project_updated',
  'project_deleted',
  'task_created',
  'task_updated',
  'task_deleted',
  'comment_added',
  'comment_deleted',
] as const;
