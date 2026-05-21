import { body, param } from 'express-validator';

export const projectIdParam = [param('id').isMongoId().withMessage('Invalid project id')];
export const projectIdParamAlt = [param('projectId').isMongoId().withMessage('Invalid project id')];

export const createProjectValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('color').optional().isHexColor(),
];

export const updateProjectValidator = [
  ...projectIdParam,
  body('name').optional().trim().notEmpty().isLength({ max: 120 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('color').optional().isHexColor(),
];
