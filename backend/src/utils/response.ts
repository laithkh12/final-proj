import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  meta?: ApiResponse['meta']
): void => {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  errors?: { field: string; message: string }[]
): void => {
  const body: ApiResponse = { success: false, message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
};
