import mongoose, { Document, Schema, Types } from 'mongoose';
import { MEMBER_ROLES } from '../constants';
import { MemberRole } from '../types';

export interface IWorkspaceMember extends Document {
  workspace: Types.ObjectId;
  user: Types.ObjectId;
  role: MemberRole;
  invitedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: MEMBER_ROLES, default: 'member' },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });

export const WorkspaceMember = mongoose.model<IWorkspaceMember>(
  'WorkspaceMember',
  workspaceMemberSchema
);
