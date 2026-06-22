import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';

export type AiPageContext = 'dashboard' | 'workspace' | 'project' | 'task';

export type AiIntent =
  | 'create_workspace'
  | 'create_project'
  | 'create_task'
  | 'create_plan'
  | 'update_task'
  | 'update_tasks'
  | 'general';

export type AiStatus = 'gathering' | 'ready';

export type AiProposalAction =
  | 'create_workspace'
  | 'create_project'
  | 'create_task'
  | 'create_plan'
  | 'update_task'
  | 'update_tasks';

/** One task to update — identified by taskTitle, with fields to change */
export interface AiProposalTaskUpdate {
  taskTitle: string;
  taskId?: string;
  title?: string;
  description?: string;
  status?: (typeof TASK_STATUSES)[number];
  priority?: (typeof TASK_PRIORITIES)[number];
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  clearAssignee?: boolean;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiPageContextPayload {
  page: AiPageContext;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
}

export interface AiProposalWorkspace {
  name: string;
  description?: string;
}

export interface AiProposalProject {
  name: string;
  description?: string;
  /** Color name (blue, green, purple) or hex — server normalizes */
  color?: string;
}

export interface AiProposalTask {
  title?: string;
  description?: string;
  status?: (typeof TASK_STATUSES)[number];
  priority?: (typeof TASK_PRIORITIES)[number];
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  clearAssignee?: boolean;
}

export interface AiProposal {
  action: AiProposalAction;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  /** Which task to update — user refers by title, server resolves to taskId */
  taskTitle?: string;
  workspace?: AiProposalWorkspace;
  project?: AiProposalProject;
  task?: AiProposalTask;
  tasks?: AiProposalTask[];
  taskUpdates?: AiProposalTaskUpdate[];
  /** When true, apply task/taskUpdates fields to every task in current project */
  allProjectTasks?: boolean;
}

export interface AiChatResult {
  message: string;
  intent: AiIntent;
  status: AiStatus;
  missingFields: string[];
  proposal: AiProposal | null;
}

export interface AiContextWorkspace {
  id: string;
  name: string;
  description: string;
  role: string;
}

export interface AiContextProject {
  id: string;
  name: string;
  workspaceId: string;
}

export interface AiContextTaskRef {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export interface AiContextTeamMember {
  id: string;
  name: string;
  role: string;
  /** Seeded automatically when a new workspace is created */
  isDefaultRoster?: boolean;
}

export interface AiContextSnapshot {
  page: AiPageContext;
  workspace?: { id: string; name: string };
  project?: { id: string; name: string; workspaceId: string };
  task?: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    projectId: string;
    workspaceId: string;
    assigneeName?: string;
    dueDate?: string;
  };
  workspaces: AiContextWorkspace[];
  projects: AiContextProject[];
  projectTasks: AiContextTaskRef[];
  teamMembers: AiContextTeamMember[];
}

export interface AiApplyTasksUpdateResult {
  type: 'tasks_updated';
  workspaceId: string;
  projectId: string;
  taskIds: string[];
  tasks: { _id: string; title: string }[];
}

export interface AiApplyPlanResult {
  type: 'plan';
  workspaceId: string;
  projectId?: string;
  taskIds: string[];
  workspace?: { _id: string; name: string };
  project?: { _id: string; name: string };
  tasks: { _id: string; title: string }[];
}
