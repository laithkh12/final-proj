import mongoose, { Document, Schema, Types } from 'mongoose';
import { ACTIVITY_TYPES } from '../constants';
import { ActivityType } from '../types';

export interface IActivityLog extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  type: ActivityType;
  message: string;
  entityType?: string;
  entityId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    message: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ workspace: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
