import { Request, Response } from 'express';
import { Comment, Project, Task } from '../models';
import { getParam } from '../utils/params';
import { logActivity } from '../services/activity.service';
import { assertAssigneeInWorkspace } from '../services/teamMember.service';
import { assertWorkspaceAdmin, assertWorkspaceMember } from '../services/workspaceAccess.service';
import { buildMeta, parsePagination } from '../helpers/pagination';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { withOptionalTransaction } from '../utils/withTransaction';

const pickTaskCreateFields = (body: Record<string, unknown>) => {
  const fields: Record<string, unknown> = { title: body.title };
  if (body.description !== undefined) fields.description = body.description;
  if (body.status !== undefined) fields.status = body.status;
  if (body.priority !== undefined) fields.priority = body.priority;
  if (body.assignee !== undefined) fields.assignee = body.assignee;
  if (body.dueDate !== undefined) fields.dueDate = body.dueDate;
  return fields;
};

const pickTaskUpdateFields = (body: Record<string, unknown>) => {
  const fields: Record<string, unknown> = {};
  if (body.title !== undefined) fields.title = body.title;
  if (body.description !== undefined) fields.description = body.description;
  if (body.status !== undefined) fields.status = body.status;
  if (body.priority !== undefined) fields.priority = body.priority;
  if (body.assignee !== undefined) fields.assignee = body.assignee;
  if (body.dueDate !== undefined) fields.dueDate = body.dueDate;
  return fields;
};

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const projectId = getParam(req, 'projectId');
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  await assertWorkspaceMember(project.workspace.toString(), req.user!.userId);

  const { page, limit, skip } = parsePagination(req.query);
  const filter: Record<string, unknown> = { project: project._id };

  if (req.query.status) filter.status = req.query.status as string;
  if (req.query.priority) filter.priority = req.query.priority as string;
  if (req.query.search) {
    filter.$text = { $search: req.query.search as string };
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', 'name email avatar role')
      .populate('createdBy', 'name email avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  sendSuccess(res, tasks, 200, undefined, buildMeta(page, limit, total));
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const projectId = getParam(req, 'projectId');
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');
  await assertWorkspaceMember(project.workspace.toString(), req.user!.userId);

  if (req.body.assignee !== undefined) {
    await assertAssigneeInWorkspace(req.body.assignee, project.workspace);
  }

  const task = await Task.create({
    ...pickTaskCreateFields(req.body as Record<string, unknown>),
    project: project._id,
    workspace: project.workspace,
    createdBy: req.user!.userId,
  });

  await logActivity({
    workspaceId: project.workspace,
    userId: req.user!.userId,
    type: 'task_created',
    message: `Created task "${task.title}"`,
    entityType: 'task',
    entityId: task._id,
  });

  const populated = await task.populate([
    { path: 'assignee', select: 'name email avatar role' },
    { path: 'createdBy', select: 'name email avatar' },
  ]);

  sendSuccess(res, populated, 201, 'Task created');
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(getParam(req, 'id'))
    .populate('assignee', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name');
  if (!task) throw new ApiError(404, 'Task not found');
  const membership = await assertWorkspaceMember(task.workspace.toString(), req.user!.userId);
  sendSuccess(res, { task, myRole: membership.role });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(getParam(req, 'id'));
  if (!task) throw new ApiError(404, 'Task not found');
  await assertWorkspaceMember(task.workspace.toString(), req.user!.userId);

  if (req.body.assignee !== undefined) {
    await assertAssigneeInWorkspace(req.body.assignee, task.workspace);
  }

  const updates = pickTaskUpdateFields(req.body as Record<string, unknown>);
  const clearDueDate = 'dueDate' in updates && updates.dueDate === null;
  if (clearDueDate) delete updates.dueDate;

  if (Object.keys(updates).length === 0 && !clearDueDate) {
    const populated = await task.populate([
      { path: 'assignee', select: 'name email avatar role' },
      { path: 'createdBy', select: 'name email avatar' },
    ]);
    sendSuccess(res, populated, 200, 'No changes');
    return;
  }

  const updateDoc: Record<string, unknown> = {};
  if (Object.keys(updates).length > 0) updateDoc.$set = updates;
  if (clearDueDate) updateDoc.$unset = { dueDate: 1 };

  const updated = await Task.findByIdAndUpdate(task._id, updateDoc, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, 'Task not found');

  await logActivity({
    workspaceId: updated.workspace,
    userId: req.user!.userId,
    type: 'task_updated',
    message: `Updated task "${updated.title}"`,
    entityType: 'task',
    entityId: updated._id,
    metadata: { ...updates, ...(clearDueDate ? { dueDate: null } : {}) },
  });

  const populated = await updated.populate([
    { path: 'assignee', select: 'name email avatar role' },
    { path: 'createdBy', select: 'name email avatar' },
  ]);

  sendSuccess(res, populated, 200, 'Task updated');
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(getParam(req, 'id'));
  if (!task) throw new ApiError(404, 'Task not found');
  await assertWorkspaceAdmin(task.workspace.toString(), req.user!.userId);

  const { _id: taskId, workspace: workspaceId, title: taskTitle } = task;

  await withOptionalTransaction(async (session) => {
    const opts = session ? { session } : {};
    await Comment.deleteMany({ task: taskId }, opts);
    await Task.deleteOne({ _id: taskId }, opts);
  });

  await logActivity({
    workspaceId,
    userId: req.user!.userId,
    type: 'task_deleted',
    message: `Deleted task "${taskTitle}"`,
    entityType: 'task',
    entityId: taskId,
  });

  sendSuccess(res, null, 200, 'Task deleted');
});
