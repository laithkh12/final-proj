import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import workspaceRoutes from './workspace.routes';
import { workspaceProjectsRouter, projectRouter } from './project.routes';
import { projectTasksRouter, taskRouter } from './task.routes';
import { taskCommentsRouter, commentRouter } from './comment.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/projects', workspaceProjectsRouter);
router.use('/projects', projectRouter);
router.use('/projects/:projectId/tasks', projectTasksRouter);
router.use('/tasks', taskRouter);
router.use('/tasks/:taskId/comments', taskCommentsRouter);
router.use('/comments', commentRouter);
router.use('/ai', aiRoutes);

export default router;
