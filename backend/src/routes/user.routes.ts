import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateUserValidator } from '../validators/user.validator';

const router = Router();

router.use(authenticate);
router.get('/me', userController.getProfile);
router.patch('/me', validate(updateUserValidator), userController.updateProfile);

export default router;
