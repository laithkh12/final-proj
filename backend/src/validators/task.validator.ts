import { body, param, query } from 'express-validator';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';

export const taskIdParam = [param('id').isMongoId().withMessage('Invalid task id')];
export const taskIdParamAlt = [param('taskId').isMongoId().withMessage('Invalid task id')];

export const createTaskValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('status').optional().isIn(TASK_STATUSES),
  body('priority').optional().isIn(TASK_PRIORITIES),
  body('assignee').optional().isMongoId(),
  body('dueDate').optional().isISO8601(),
];

export const updateTaskValidator = [
  ...taskIdParam,
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('status').optional().isIn(TASK_STATUSES),
  body('priority').optional().isIn(TASK_PRIORITIES),
  body('assignee').optional({ nullable: true }).isMongoId(),
  body('dueDate').optional({ nullable: true }).isISO8601(),
];

export const taskListQueryValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(TASK_STATUSES),
  query('priority').optional().isIn(TASK_PRIORITIES),
  query('search').optional().trim().isLength({ max: 100 }),
];
