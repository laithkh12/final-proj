import { body, param } from 'express-validator';

export const commentIdParam = [param('id').isMongoId().withMessage('Invalid comment id')];

export const createCommentValidator = [
  body('content').trim().notEmpty().withMessage('Content is required').isLength({ max: 2000 }),
];
