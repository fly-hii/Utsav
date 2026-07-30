import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Multer errors
  if (err.name === 'MulterError') {
    const multerErr = err as any;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File too large', 413);
      return;
    }
    if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      sendError(res, 'Unexpected file field', 400);
      return;
    }
    sendError(res, `Upload error: ${multerErr.message}`, 400);
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = prismaErr.meta?.target;
      sendError(res, `Duplicate entry for ${target}`, 409);
      return;
    }
    if (prismaErr.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    sendError(res, 'Validation error', 400, err);
    return;
  }

  // Custom file type error from multer filter
  if (err.message && err.message.includes('File type not allowed')) {
    sendError(res, err.message, 400);
    return;
  }

  // Default 500
  const statusCode = (err as any).statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  sendError(res, message, statusCode);
}
