import { Types } from 'mongoose';
import { ACTIVITY_TYPES, MEMBER_ROLES, TASK_PRIORITIES, TASK_STATUSES } from '../constants';

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type MemberRole = (typeof MEMBER_ROLES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: { field: string; message: string }[];
}

export interface IUserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
