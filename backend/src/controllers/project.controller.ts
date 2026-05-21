import { Request, Response } from 'express';
import { Project, Task } from '../models';
import { logActivity } from '../services/activity.service';
import { assertWorkspaceMember } from '../services/workspaceAccess.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { getParam } from '../utils/params';

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = getParam(req, 'workspaceId');
  await assertWorkspaceMember(workspaceId, req.user!.userId);
  const projects = await Project.find({ workspace: workspaceId })
    .populate('createdBy', 'name email avatar')
    .sort({ updatedAt: -1 });

  const withCounts = await Promise.all(
    projects.map(async (p) => {
      const taskCount = await Task.countDocuments({ project: p._id });
      return { ...p.toObject(), taskCount };
    })
  );

  sendSuccess(res, withCounts);
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = getParam(req, 'workspaceId');
  await assertWorkspaceMember(workspaceId, req.user!.userId);
  const { name, description, color } = req.body as {
    name: string;
    description?: string;
    color?: string;
  };

  const project = await Project.create({
    name,
    description: description || '',
    color: color || '#6366f1',
    workspace: workspaceId,
    createdBy: req.user!.userId,
  });

  await logActivity({
    workspaceId: workspaceId,
    userId: req.user!.userId,
    type: 'project_created',
    message: `Created project "${project.name}"`,
    entityType: 'project',
    entityId: project._id,
  });

  sendSuccess(res, project, 201, 'Project created');
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(getParam(req, 'id')).populate('createdBy', 'name email avatar');
  if (!project) throw new ApiError(404, 'Project not found');

  await assertWorkspaceMember(project.workspace.toString(), req.user!.userId);

  const taskStats = await Task.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  sendSuccess(res, { project, taskStats });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(getParam(req, 'id'));
  if (!project) throw new ApiError(404, 'Project not found');
  await assertWorkspaceMember(project.workspace.toString(), req.user!.userId);

  Object.assign(project, req.body);
  await project.save();

  await logActivity({
    workspaceId: project.workspace,
    userId: req.user!.userId,
    type: 'project_updated',
    message: `Updated project "${project.name}"`,
    entityType: 'project',
    entityId: project._id,
  });

  sendSuccess(res, project, 200, 'Project updated');
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(getParam(req, 'id'));
  if (!project) throw new ApiError(404, 'Project not found');
  await assertWorkspaceMember(project.workspace.toString(), req.user!.userId);

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  await logActivity({
    workspaceId: project.workspace,
    userId: req.user!.userId,
    type: 'project_deleted',
    message: `Deleted project "${project.name}"`,
    entityType: 'project',
    entityId: project._id,
  });

  sendSuccess(res, null, 200, 'Project deleted');
});
