import { body } from 'express-validator';

export const updateUserValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('avatar').optional().trim().isURL(),
];
