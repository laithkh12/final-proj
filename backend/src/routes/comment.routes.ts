import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { commentIdParam, createCommentValidator } from '../validators/comment.validator';
import { taskIdParamAlt } from '../validators/task.validator';

const taskCommentsRouter = Router({ mergeParams: true });
taskCommentsRouter.use(authenticate);
taskCommentsRouter.get('/', validate(taskIdParamAlt), commentController.getComments);
taskCommentsRouter.post(
  '/',
  validate([...taskIdParamAlt, ...createCommentValidator]),
  commentController.createComment
);

const commentRouter = Router();
commentRouter.use(authenticate);
commentRouter.delete('/:id', validate(commentIdParam), commentController.deleteComment);

export { taskCommentsRouter, commentRouter };
