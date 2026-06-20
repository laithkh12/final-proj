import { Request, Response } from 'express';
import { Comment, ITask, Task } from '../models';
import { logActivity } from '../services/activity.service';
import { assertWorkspaceMember } from '../services/workspaceAccess.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { getParam } from '../utils/params';

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(getParam(req, 'taskId'));
  if (!task) throw new ApiError(404, 'Task not found');
  await assertWorkspaceMember(task.workspace.toString(), req.user!.userId);

  const comments = await Comment.find({ task: task._id })
    .populate('author', 'name email avatar')
    .sort({ createdAt: -1 });

  sendSuccess(res, comments);
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(getParam(req, 'taskId'));
  if (!task) throw new ApiError(404, 'Task not found');
  await assertWorkspaceMember(task.workspace.toString(), req.user!.userId);

  const comment = await Comment.create({
    content: req.body.content as string,
    task: task._id,
    author: req.user!.userId,
  });

  await logActivity({
    workspaceId: task.workspace,
    userId: req.user!.userId,
    type: 'comment_added',
    message: `Commented on task "${task.title}"`,
    entityType: 'comment',
    entityId: comment._id,
  });

  const populated = await comment.populate('author', 'name email avatar');
  sendSuccess(res, populated, 201, 'Comment added');
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(getParam(req, 'id')).populate<{ task: ITask }>('task');
  if (!comment) throw new ApiError(404, 'Comment not found');

  const taskDoc = comment.task;
  if (!taskDoc?.workspace) throw new ApiError(404, 'Task not found');
  await assertWorkspaceMember(taskDoc.workspace.toString(), req.user!.userId);

  if (comment.author.toString() !== req.user!.userId) {
    throw new ApiError(403, 'You can only delete your own comments');
  }

  await comment.deleteOne();

  await logActivity({
    workspaceId: taskDoc.workspace,
    userId: req.user!.userId,
    type: 'comment_deleted',
    message: `Deleted a comment on "${taskDoc.title}"`,
    entityType: 'comment',
    entityId: comment._id,
  });

  sendSuccess(res, null, 200, 'Comment deleted');
});
