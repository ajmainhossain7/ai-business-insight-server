import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.utils';
import { isDevelopment } from '../config/env';

// ============================================================
// Global Error Handler Middleware
// ============================================================

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function createError(message: string, statusCode = 500): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function globalErrorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  logger.error(`[${statusCode}] ${err.message}`, {
    stack: isDevelopment ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack }),
  });
}

// Handle unhandled promise rejections
export function handleMulterError(err: AppError, _req: Request, res: Response, next: NextFunction): void {
  if (err.message?.includes('Only CSV files are allowed')) {
    res.status(400).json({ success: false, message: 'Only CSV files are allowed.' });
    return;
  }
  if (err.message?.includes('File too large')) {
    res.status(400).json({ success: false, message: 'File size exceeds the maximum limit.' });
    return;
  }
  next(err);
}
