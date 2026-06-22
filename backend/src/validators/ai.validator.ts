import { body } from 'express-validator';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';

const pageContexts = ['dashboard', 'workspace', 'project', 'task'] as const;
const proposalActions = [
  'create_workspace',
  'create_project',
  'create_task',
  'create_plan',
  'update_task',
  'update_tasks',
] as const;

export const aiChatValidator = [
  body('messages')
    .isArray({ min: 1, max: 40 })
    .withMessage('messages must be a non-empty array'),
  body('messages.*.role').isIn(['user', 'assistant']).withMessage('Invalid message role'),
  body('messages.*.content')
    .isString()
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message content required'),
  body('context.page').isIn(pageContexts).withMessage('Invalid page context'),
  body('context.workspaceId').optional().isMongoId(),
  body('context.projectId').optional().isMongoId(),
  body('context.taskId').optional().isMongoId(),
];

export const aiApplyValidator = [
  body('proposal.action').isIn(proposalActions).withMessage('Invalid action'),
  body('proposal.workspaceId').optional().isMongoId(),
  body('proposal.projectId').optional().isMongoId(),
  body('proposal.taskId').optional().isMongoId(),
  body('proposal.taskTitle').optional().trim().isLength({ max: 200 }),
  body('proposal.workspace.name').optional().trim().isLength({ max: 120 }),
  body('proposal.workspace.description').optional().trim().isLength({ max: 500 }),
  body('proposal.project.name').optional().trim().isLength({ max: 120 }),
  body('proposal.project.description').optional().trim().isLength({ max: 1000 }),
  body('proposal.project.color').optional().trim().isLength({ max: 32 }),
  body('proposal.task.title').optional().trim().isLength({ max: 200 }),
  body('proposal.task.description').optional().trim().isLength({ max: 5000 }),
  body('proposal.task.priority').optional().isIn(TASK_PRIORITIES),
  body('proposal.task.status').optional().isIn(TASK_STATUSES),
  body('proposal.task.assigneeId').optional().isMongoId(),
  body('proposal.task.dueDate').optional().isISO8601(),
  body('proposal.tasks').optional().isArray({ max: 20 }),
  body('proposal.tasks.*.title').optional().trim().isLength({ max: 200 }),
  body('proposal.tasks.*.description').optional().trim().isLength({ max: 5000 }),
  body('proposal.tasks.*.priority').optional().isIn(TASK_PRIORITIES),
  body('proposal.tasks.*.status').optional().isIn(TASK_STATUSES),
  body('proposal.tasks.*.assigneeId').optional().isMongoId(),
  body('proposal.tasks.*.dueDate').optional().isISO8601(),
  body('proposal.taskUpdates').optional().isArray({ max: 20 }),
  body('proposal.taskUpdates.*.taskTitle').optional().trim().isLength({ min: 1, max: 200 }),
  body('proposal.taskUpdates.*.taskId').optional().isMongoId(),
  body('proposal.taskUpdates.*.title').optional().trim().isLength({ max: 200 }),
  body('proposal.taskUpdates.*.description').optional().trim().isLength({ max: 5000 }),
  body('proposal.taskUpdates.*.priority').optional().isIn(TASK_PRIORITIES),
  body('proposal.taskUpdates.*.status').optional().isIn(TASK_STATUSES),
  body('proposal.taskUpdates.*.assigneeId').optional().isMongoId(),
  body('proposal.taskUpdates.*.dueDate').optional().isISO8601(),
  body('proposal.allProjectTasks').optional().isBoolean(),
];
