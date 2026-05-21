import { Request } from 'express';
import { ApiError } from './ApiError';

export const getParam = (req: Request, key: string): string => {
  const value = req.params[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value[0]) return value[0];
  throw new ApiError(400, `Invalid parameter: ${key}`);
};
