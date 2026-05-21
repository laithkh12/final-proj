import { Request, Response } from 'express';
import { Project, Task } from '../models';
import { getParam } from '../utils/params';
import { logActivity } from '../services/activity.service';
import { assertWorkspaceMember } from '../services/workspaceAccess.service';
import { buildMeta, parsePagination } from '../helpers/pagination';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';

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
      .populate('assignee', 'name email avatar')
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

  const task = await Task.create({
    ...req.body,
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
    { path: 'assignee', select: 'name email avatar' },
    { path: 'createdBy', select: 'name email avatar' },
  ]);

  sendSuccess(res, populated, 201, 'Task created');
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(getParam(req, 'id'))
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name');
  if (!task) throw new ApiError(404, 'Task not found');
  await assertWorkspaceMember(task.workspace.toString(), req.user!.userId);
  sendSuccess(res, task);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(getParam(req, 'id'));
  if (!task) throw new ApiError(404, 'Task not found');
  await assertWorkspaceMember(task.workspace.toString(), req.user!.userId);

  Object.assign(task, req.body);
  await task.save();

  await logActivity({
    workspaceId: task.workspace,
    userId: req.user!.userId,
    type: 'task_updated',
    message: `Updated task "${task.title}"`,
    entityType: 'task',
    entityId: task._id,
    metadata: req.body as Record<string, unknown>,
  });

  const populated = await task.populate([
    { path: 'assignee', select: 'name email avatar' },
    { path: 'createdBy', select: 'name email avatar' },
  ]);

  sendSuccess(res, populated, 200, 'Task updated');
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(getParam(req, 'id'));
  if (!task) throw new ApiError(404, 'Task not found');
  await assertWorkspaceMember(task.workspace.toString(), req.user!.userId);

  await logActivity({
    workspaceId: task.workspace,
    userId: req.user!.userId,
    type: 'task_deleted',
    message: `Deleted task "${task.title}"`,
    entityType: 'task',
    entityId: task._id,
  });

  await task.deleteOne();
  sendSuccess(res, null, 200, 'Task deleted');
});
