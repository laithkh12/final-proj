import { Types } from 'mongoose';
import { ActivityLog } from '../models';
import { ActivityType } from '../types';

interface LogActivityParams {
  workspaceId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  type: ActivityType;
  message: string;
  entityType?: string;
  entityId?: Types.ObjectId | string;
  metadata?: Record<string, unknown>;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  await ActivityLog.create({
    workspace: params.workspaceId,
    user: params.userId,
    type: params.type,
    message: params.message,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata,
  });
};
