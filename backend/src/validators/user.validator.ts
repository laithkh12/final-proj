import { body } from 'express-validator';

export const updateUserValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('avatar')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true, require_host: true })
    .withMessage('Avatar must be a valid http or https URL'),
];
