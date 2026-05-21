import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies?.token) {
    return req.cookies.token as string;
  }
  return null;
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }
    req.user = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = extractToken(req);
    if (token) {
      req.user = verifyToken(token);
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
};
