import { Request, Response } from 'express';
import { User } from '../models';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

const setAuthCookie = (res: Response, token: string): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(400, 'Email already registered');

  const user = await User.create({ name, email, password });
  const token = signToken({ userId: user._id.toString(), email: user.email });
  setAuthCookie(res, token);

  sendSuccess(
    res,
    { user, token },
    201,
    'Account created successfully'
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken({ userId: user._id.toString(), email: user.email });
  setAuthCookie(res, token);

  sendSuccess(res, { user, token }, 200, 'Logged in successfully');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) throw new ApiError(404, 'User not found');
  sendSuccess(res, user);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('token');
  sendSuccess(res, null, 200, 'Logged out successfully');
});
