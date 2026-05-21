import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createProjectValidator,
  projectIdParam,
  updateProjectValidator,
} from '../validators/project.validator';
import { workspaceIdParamAlt } from '../validators/workspace.validator';

const workspaceProjectsRouter = Router({ mergeParams: true });
workspaceProjectsRouter.use(authenticate);
workspaceProjectsRouter.get(
  '/',
  validate(workspaceIdParamAlt),
  projectController.getProjects
);
workspaceProjectsRouter.post(
  '/',
  validate([...workspaceIdParamAlt, ...createProjectValidator]),
  projectController.createProject
);

const projectRouter = Router();
projectRouter.use(authenticate);
projectRouter.get('/:id', validate(projectIdParam), projectController.getProject);
projectRouter.patch('/:id', validate(updateProjectValidator), projectController.updateProject);
projectRouter.delete('/:id', validate(projectIdParam), projectController.deleteProject);

export { workspaceProjectsRouter, projectRouter };
