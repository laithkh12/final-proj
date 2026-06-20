import mongoose, { Types } from 'mongoose';
import { TeamMember } from '../models';
import { ApiError } from '../utils/ApiError';

export const DEFAULT_TEAM_MEMBERS = [
  {
    name: 'Alice Chen',
    email: 'alice@teamflow.demo',
    role: 'Frontend developer',
    avatar: 'https://i.pravatar.cc/150?u=alice@teamflow.demo',
  },
  {
    name: 'Bob Martinez',
    email: 'bob@teamflow.demo',
    role: 'Backend developer',
    avatar: 'https://i.pravatar.cc/150?u=bob@teamflow.demo',
  },
  {
    name: 'Carol Nguyen',
    email: 'carol@teamflow.demo',
    role: 'Product designer',
    avatar: 'https://i.pravatar.cc/150?u=carol@teamflow.demo',
  },
  {
    name: 'David Kim',
    email: 'david@teamflow.demo',
    role: 'QA engineer',
    avatar: 'https://i.pravatar.cc/150?u=david@teamflow.demo',
  },
] as const;

export async function seedDefaultTeamMembers(workspaceId: Types.ObjectId | string) {
  for (const demo of DEFAULT_TEAM_MEMBERS) {
    try {
      await TeamMember.create({ ...demo, workspace: workspaceId });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
}

/** Seeds demo team members for workspaces missing any defaults (e.g. legacy data). */
export async function ensureDefaultTeamMembers(workspaceId: Types.ObjectId | string) {
  const count = await TeamMember.countDocuments({ workspace: workspaceId });
  if (count < DEFAULT_TEAM_MEMBERS.length) {
    await seedDefaultTeamMembers(workspaceId);
  }
}

/** Ensures assignee is null/unset or a team member in the given workspace. */
export async function assertAssigneeInWorkspace(
  assignee: unknown,
  workspaceId: Types.ObjectId | string
): Promise<void> {
  if (assignee === undefined || assignee === null || assignee === '') return;

  if (typeof assignee !== 'string' || !mongoose.isValidObjectId(assignee)) {
    throw new ApiError(400, 'Invalid assignee id');
  }

  const member = await TeamMember.findOne({ _id: assignee, workspace: workspaceId });
  if (!member) {
    throw new ApiError(400, 'Assignee must be a team member of this workspace');
  }
}
