import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types/api.types';

// ============================================================
// Standardized API Response Helpers
// ============================================================

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendError(
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  error?: string
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    ...(error && { error }),
  };
  return res.status(statusCode).json(response);
}

export function sendNotFound(res: Response, resource = 'Resource'): Response {
  return sendError(res, `${resource} not found`, 404);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized'): Response {
  return sendError(res, message, 401);
}

export function sendForbidden(res: Response, message = 'Forbidden'): Response {
  return sendError(res, message, 403);
}

export function sendBadRequest(res: Response, message = 'Bad request', error?: string): Response {
  return sendError(res, message, 400, error);
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
