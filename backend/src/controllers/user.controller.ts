import { Request, Response } from 'express';
import { User } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(404, 'User not found');
  sendSuccess(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, bio, avatar } = req.body as { name?: string; bio?: string; avatar?: string };
  const user = await User.findByIdAndUpdate(
    req.user!.userId,
    { ...(name && { name }), ...(bio !== undefined && { bio }), ...(avatar !== undefined && { avatar }) },
    { new: true, runValidators: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  sendSuccess(res, user, 200, 'Profile updated');
});
