export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type MemberRole = 'owner' | 'admin' | 'member';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  workspace: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workspace {
  _id: string;
  name: string;
  description: string;
  slug: string;
  owner: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  _id: string;
  workspace: string;
  user: User;
  role: MemberRole;
  invitedBy: User;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  workspace: string;
  createdBy: User | string;
  color: string;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: string | Project;
  workspace: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: TeamMember | string;
  createdBy: User | string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  task: string;
  author: User;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  workspace: string | Workspace;
  user: User;
  type: string;
  message: string;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: { field: string; message: string }[];
}

export interface DashboardStats {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  projectCount: number;
  workspaceCount: number;
  recentActivity: ActivityLog[];
}

export interface AuthResponse {
  user: User;
}

export type AiPageContext = 'dashboard' | 'workspace' | 'project' | 'task';

export type AiIntent =
  | 'create_workspace'
  | 'create_project'
  | 'create_task'
  | 'create_plan'
  | 'update_task'
  | 'update_tasks'
  | 'general';

export type AiProposalAction =
  | 'create_workspace'
  | 'create_project'
  | 'create_task'
  | 'create_plan'
  | 'update_task'
  | 'update_tasks';

export type AiStatus = 'gathering' | 'ready';

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

export interface AiProposal {
  action: AiProposalAction;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  taskTitle?: string;
  workspace?: { name: string; description?: string };
  project?: { name: string; description?: string; color?: string };
  task?: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    assigneeName?: string;
    dueDate?: string;
    clearAssignee?: boolean;
  };
  tasks?: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    assigneeName?: string;
    dueDate?: string;
  }[];
  taskUpdates?: {
    taskTitle: string;
    taskId?: string;
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    assigneeName?: string;
    dueDate?: string;
    clearAssignee?: boolean;
  }[];
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

export interface AiChatResult {
  message: string;
  intent: AiIntent;
  status: AiStatus;
  missingFields: string[];
  proposal: AiProposal | null;
}

export type AiApplyResult =
  | {
      type: 'workspace';
      entity: Workspace;
    }
  | {
      type: 'project';
      entity: Project;
      workspaceId: string;
    }
  | {
      type: 'task';
      entity: Task;
      workspaceId: string;
      projectId: string;
    }
  | {
      type: 'task_updated';
      entity: Task;
      workspaceId: string;
      projectId: string;
    }
  | AiApplyTasksUpdateResult
  | AiApplyPlanResult;
