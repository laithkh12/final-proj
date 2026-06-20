import { body, param } from 'express-validator';
import { MEMBER_ROLES } from '../constants';

export const workspaceIdParam = [param('id').isMongoId().withMessage('Invalid workspace id')];
export const workspaceIdParamAlt = [
  param('workspaceId').isMongoId().withMessage('Invalid workspace id'),
];

export const createWorkspaceValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

export const updateWorkspaceValidator = [
  ...workspaceIdParam,
  body('name').optional().trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

export const inviteMemberValidator = [
  ...workspaceIdParam,
  body('email').trim().isEmail().withMessage('Valid email required'),
  body('role').optional().isIn(MEMBER_ROLES.filter((r) => r !== 'owner')),
];

export const removeMemberValidator = [
  ...workspaceIdParam,
  param('userId').isMongoId().withMessage('Invalid user id'),
];
