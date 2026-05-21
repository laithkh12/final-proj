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
  assignee?: User | string;
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
  token: string;
}
