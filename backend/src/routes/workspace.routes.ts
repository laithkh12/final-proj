import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createWorkspaceValidator,
  inviteMemberValidator,
  updateWorkspaceValidator,
  workspaceIdParam,
} from '../validators/workspace.validator';

const router = Router();

router.use(authenticate);

router.get('/dashboard/stats', workspaceController.getDashboardStats);
router.get('/', workspaceController.getWorkspaces);
router.post('/', validate(createWorkspaceValidator), workspaceController.createWorkspace);
router.get('/:id/activity', validate(workspaceIdParam), workspaceController.getActivity);
router.get('/:id', validate(workspaceIdParam), workspaceController.getWorkspace);
router.patch('/:id', validate(updateWorkspaceValidator), workspaceController.updateWorkspace);
router.delete('/:id', validate(workspaceIdParam), workspaceController.deleteWorkspace);
router.post('/:id/members', validate(inviteMemberValidator), workspaceController.inviteMember);

export default router;
