import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { sendError } from '../utils/response';
import { env } from '../config/env';

export const notFound = (req: Request, res: Response): void => {
  sendError(res, 404, `Route ${req.originalUrl} not found`);
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof ApiError) {
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    sendError(res, 400, 'Validation failed', errors);
    return;
  }

  if ((err as { code?: number }).code === 11000) {
    sendError(res, 400, 'Duplicate field value');
    return;
  }

  console.error(err);
  const message = env.isProduction ? 'Internal server error' : err.message;
  sendError(res, 500, message);
};
