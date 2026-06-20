import { Request, Response } from 'express';
import { TeamMember } from '../models';
import { ensureDefaultTeamMembers } from '../services/teamMember.service';
import { assertWorkspaceMember } from '../services/workspaceAccess.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { getParam } from '../utils/params';

export const getTeamMembers = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = getParam(req, 'id');
  await assertWorkspaceMember(workspaceId, req.user!.userId);
  await ensureDefaultTeamMembers(workspaceId);

  const members = await TeamMember.find({ workspace: workspaceId }).sort({ name: 1 });
  sendSuccess(res, members);
});
