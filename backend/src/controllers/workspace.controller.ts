import { Request, Response } from 'express';
import { ActivityLog, Comment, Project, Task, TeamMember, User, Workspace, WorkspaceMember } from '../models';
import { logActivity } from '../services/activity.service';
import { seedDefaultTeamMembers } from '../services/teamMember.service';
import {
  assertWorkspaceAdmin,
  assertWorkspaceMember,
  assertWorkspaceOwner,
  canManageRole,
  getUserWorkspaceIds,
} from '../services/workspaceAccess.service';
import { MemberRole } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { buildMeta, parsePagination } from '../helpers/pagination';
import { getParam } from '../utils/params';
import { withOptionalTransaction } from '../utils/withTransaction';

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') +
  '-' +
  Date.now().toString(36);

const pickWorkspaceUpdateFields = (body: Record<string, unknown>) => {
  const fields: Record<string, unknown> = {};
  if (body.name !== undefined) fields.name = body.name;
  if (body.description !== undefined) fields.description = body.description;
  return fields;
};

export const getWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const ids = await getUserWorkspaceIds(req.user!.userId);
  const workspaces = await Workspace.find({ _id: { $in: ids } })
    .populate('owner', 'name email avatar')
    .sort({ updatedAt: -1 });
  sendSuccess(res, workspaces);
});

export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };
  const workspace = await Workspace.create({
    name,
    description: description || '',
    slug: slugify(name),
    owner: req.user!.userId,
  });

  await WorkspaceMember.create({
    workspace: workspace._id,
    user: req.user!.userId,
    role: 'owner',
    invitedBy: req.user!.userId,
  });

  await seedDefaultTeamMembers(workspace._id);

  await logActivity({
    workspaceId: workspace._id,
    userId: req.user!.userId,
    type: 'workspace_created',
    message: `Created workspace "${workspace.name}"`,
    entityType: 'workspace',
    entityId: workspace._id,
  });

  sendSuccess(res, workspace, 201, 'Workspace created');
});

export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  await assertWorkspaceMember(id, req.user!.userId);
  const workspace = await Workspace.findById(id).populate('owner', 'name email avatar');
  if (!workspace) throw new ApiError(404, 'Workspace not found');

  const members = await WorkspaceMember.find({ workspace: workspace._id })
    .populate('user', 'name email avatar')
    .populate('invitedBy', 'name email');

  const projectCount = await Project.countDocuments({ workspace: workspace._id });
  const taskCount = await Task.countDocuments({ workspace: workspace._id });

  sendSuccess(res, { workspace, members, stats: { projectCount, taskCount } });
});

export const updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  await assertWorkspaceAdmin(id, req.user!.userId);

  const updates = pickWorkspaceUpdateFields(req.body as Record<string, unknown>);
  if (Object.keys(updates).length === 0) {
    const workspace = await Workspace.findById(id);
    if (!workspace) throw new ApiError(404, 'Workspace not found');
    sendSuccess(res, workspace, 200, 'No changes');
    return;
  }

  const workspace = await Workspace.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
  if (!workspace) throw new ApiError(404, 'Workspace not found');

  await logActivity({
    workspaceId: workspace._id,
    userId: req.user!.userId,
    type: 'workspace_updated',
    message: `Updated workspace "${workspace.name}"`,
    entityType: 'workspace',
    entityId: workspace._id,
    metadata: updates,
  });

  sendSuccess(res, workspace, 200, 'Workspace updated');
});

export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  await assertWorkspaceOwner(id, req.user!.userId);
  const workspace = await Workspace.findById(id);
  if (!workspace) throw new ApiError(404, 'Workspace not found');

  const workspaceId = workspace._id;

  await withOptionalTransaction(async (session) => {
    const opts = session ? { session } : {};
    const taskIds = session
      ? await Task.distinct('_id', { workspace: workspaceId }).session(session)
      : await Task.find({ workspace: workspaceId }).distinct('_id');
    if (taskIds.length > 0) {
      await Comment.deleteMany({ task: { $in: taskIds } }, opts);
    }
    await Task.deleteMany({ workspace: workspaceId }, opts);
    await Project.deleteMany({ workspace: workspaceId }, opts);
    await WorkspaceMember.deleteMany({ workspace: workspaceId }, opts);
    await TeamMember.deleteMany({ workspace: workspaceId }, opts);
    await ActivityLog.deleteMany({ workspace: workspaceId }, opts);
    await Workspace.deleteOne({ _id: workspaceId }, opts);
  });

  sendSuccess(res, null, 200, 'Workspace deleted');
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  const actorMembership = await assertWorkspaceAdmin(id, req.user!.userId);
  const { email, role = 'member' } = req.body as { email: string; role?: string };

  if (role === 'admin' && actorMembership.role !== 'owner') {
    throw new ApiError(403, 'Only the workspace owner can invite admins');
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found. They must sign up first.');

  const existing = await WorkspaceMember.findOne({ workspace: id, user: user._id });
  if (existing) throw new ApiError(400, 'User is already a member');

  const member = await WorkspaceMember.create({
    workspace: id,
    user: user._id,
    role: role as 'member' | 'admin',
    invitedBy: req.user!.userId,
  });

  await logActivity({
    workspaceId: id,
    userId: req.user!.userId,
    type: 'member_invited',
    message: `Invited ${user.name} to the workspace`,
    entityType: 'member',
    entityId: user._id,
  });

  const populated = await member.populate('user', 'name email avatar');
  sendSuccess(res, populated, 201, 'Member invited');
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = getParam(req, 'id');
  const targetUserId = getParam(req, 'userId');

  const actorMembership = await assertWorkspaceAdmin(workspaceId, req.user!.userId);

  const targetMembership = await WorkspaceMember.findOne({
    workspace: workspaceId,
    user: targetUserId,
  }).populate('user', 'name email avatar');

  if (!targetMembership) throw new ApiError(404, 'Member not found');
  if (targetUserId === req.user!.userId) {
    throw new ApiError(403, 'You cannot remove yourself');
  }
  if (targetMembership.role === 'owner') {
    throw new ApiError(403, 'Cannot remove the workspace owner');
  }
  if (
    !canManageRole(
      actorMembership.role as MemberRole,
      targetMembership.role as MemberRole
    )
  ) {
    throw new ApiError(403, 'You cannot remove this member');
  }

  const userName =
    targetMembership.user &&
    typeof targetMembership.user === 'object' &&
    'name' in targetMembership.user
      ? (targetMembership.user as { name: string }).name
      : 'Member';

  await targetMembership.deleteOne();

  await logActivity({
    workspaceId,
    userId: req.user!.userId,
    type: 'member_removed',
    message: `Removed ${userName} from the workspace`,
    entityType: 'member',
    entityId: targetUserId,
  });

  sendSuccess(res, null, 200, 'Member removed');
});

export const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  await assertWorkspaceMember(id, req.user!.userId);
  const { page, limit, skip } = parsePagination(req.query);

  const filter = { workspace: id };
  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  sendSuccess(res, logs, 200, undefined, buildMeta(page, limit, total));
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const ids = await getUserWorkspaceIds(req.user!.userId);

  const [taskStats, projectCount, recentActivity] = await Promise.all([
    Task.aggregate([
      { $match: { workspace: { $in: ids } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Project.countDocuments({ workspace: { $in: ids } }),
    ActivityLog.find({ workspace: { $in: ids } })
      .populate('user', 'name avatar')
      .populate('workspace', 'name')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const tasksByStatus = Object.fromEntries(taskStats.map((s) => [s._id, s.count]));
  const totalTasks = taskStats.reduce((sum, s) => sum + s.count, 0);

  sendSuccess(res, {
    totalTasks,
    tasksByStatus,
    projectCount,
    workspaceCount: ids.length,
    recentActivity,
  });
});
