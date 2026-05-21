import { Types } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { Workspace, WorkspaceMember } from '../models';
import { MemberRole } from '../types';

export const getMembership = async (workspaceId: string, userId: string) => {
  const membership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: userId,
  });
  return membership;
};

export const assertWorkspaceMember = async (workspaceId: string, userId: string) => {
  const membership = await getMembership(workspaceId, userId);
  if (!membership) {
    throw new ApiError(403, 'You do not have access to this workspace');
  }
  return membership;
};

export const assertWorkspaceAdmin = async (workspaceId: string, userId: string) => {
  const membership = await assertWorkspaceMember(workspaceId, userId);
  if (!['owner', 'admin'].includes(membership.role)) {
    throw new ApiError(403, 'Admin access required');
  }
  return membership;
};

export const assertWorkspaceOwner = async (workspaceId: string, userId: string) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  if (workspace.owner.toString() !== userId) {
    throw new ApiError(403, 'Only the workspace owner can perform this action');
  }
  return workspace;
};

export const getUserWorkspaceIds = async (userId: string): Promise<Types.ObjectId[]> => {
  const memberships = await WorkspaceMember.find({ user: userId }).select('workspace');
  return memberships.map((m) => m.workspace as Types.ObjectId);
};

export const canManageRole = (actorRole: MemberRole, targetRole: MemberRole): boolean => {
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin' && targetRole === 'member') return true;
  return false;
};
