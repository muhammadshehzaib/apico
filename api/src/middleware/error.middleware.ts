import { Request, Response, NextFunction } from 'express';
import { error } from '../utils/response.util';
import { ZodError } from 'zod';

interface AppError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    error(res, `Validation error: ${err.errors[0].message}`, 400);
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      error(res, `Unique constraint violation on field: ${prismaErr.meta?.target?.[0] || 'unknown'}`, 400);
      return;
    }
    if (prismaErr.code === 'P2025') {
      error(res, 'Record not found', 404);
      return;
    }
  }

  if (err.name === 'JsonWebTokenError') {
    error(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    error(res, 'Token expired', 401);
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  error(res, message, statusCode);
};
