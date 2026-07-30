import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponse['meta']
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  message = 'Internal Server Error',
  statusCode = 500,
  errors?: any
): void {
  const response: ApiResponse = {
    success: false,
    message,
  };
  if (errors) response.data = errors;
  res.status(statusCode).json(response);
}

/**
 * Send a not found response
 */
export function sendNotFound(res: Response, resource = 'Resource'): void {
  sendError(res, `${resource} not found`, 404);
}

/**
 * Send an unauthorized response
 */
export function sendUnauthorized(res: Response, message = 'Unauthorized'): void {
  sendError(res, message, 401);
}

/**
 * Send a forbidden response
 */
export function sendForbidden(res: Response, message = 'Forbidden'): void {
  sendError(res, message, 403);
}

/**
 * Send a bad request response
 */
export function sendBadRequest(res: Response, message = 'Bad request', errors?: any): void {
  sendError(res, message, 400, errors);
}

/**
 * Parse pagination params from query string
 */
export function parsePagination(query: any): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination meta object
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): ApiResponse['meta'] {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
