import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTaskValidator,
  taskIdParam,
  taskListQueryValidator,
  updateTaskValidator,
} from '../validators/task.validator';
import { projectIdParamAlt } from '../validators/project.validator';

const projectTasksRouter = Router({ mergeParams: true });
projectTasksRouter.use(authenticate);
projectTasksRouter.get(
  '/',
  validate([...projectIdParamAlt, ...taskListQueryValidator]),
  taskController.getTasks
);
projectTasksRouter.post(
  '/',
  validate([...projectIdParamAlt, ...createTaskValidator]),
  taskController.createTask
);

const taskRouter = Router();
taskRouter.use(authenticate);
taskRouter.get('/:id', validate(taskIdParam), taskController.getTask);
taskRouter.patch('/:id', validate(updateTaskValidator), taskController.updateTask);
taskRouter.delete('/:id', validate(taskIdParam), taskController.deleteTask);

export { projectTasksRouter, taskRouter };
