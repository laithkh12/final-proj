import { Router } from 'express';
import * as workspaceController from '../controllers/workspace.controller';
import * as teamMemberController from '../controllers/teamMember.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createWorkspaceValidator,
  inviteMemberValidator,
  removeMemberValidator,
  updateWorkspaceValidator,
  workspaceIdParam,
} from '../validators/workspace.validator';

const router = Router();

router.use(authenticate);

router.get('/dashboard/stats', workspaceController.getDashboardStats);
router.get('/', workspaceController.getWorkspaces);
router.post('/', validate(createWorkspaceValidator), workspaceController.createWorkspace);
router.get('/:id/activity', validate(workspaceIdParam), workspaceController.getActivity);
/**
 * @openapi
 * /api/workspaces/{id}/team-members:
 *   get:
 *     tags: [Workspaces]
 *     summary: List assignable team members for a workspace
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team member roster
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamMember'
 */
router.get('/:id/team-members', validate(workspaceIdParam), teamMemberController.getTeamMembers);
router.get('/:id', validate(workspaceIdParam), workspaceController.getWorkspace);
router.patch('/:id', validate(updateWorkspaceValidator), workspaceController.updateWorkspace);
router.delete('/:id', validate(workspaceIdParam), workspaceController.deleteWorkspace);
router.post('/:id/members', validate(inviteMemberValidator), workspaceController.inviteMember);
/**
 * @openapi
 * /api/workspaces/{id}/members/{userId}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Remove a member from the workspace (admin/owner)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member removed
 */
router.delete(
  '/:id/members/:userId',
  validate(removeMemberValidator),
  workspaceController.removeMember
);

export default router;
