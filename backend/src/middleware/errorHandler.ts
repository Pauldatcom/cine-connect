import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '@cine-connect/shared';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  static conflict(message: string) {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, false);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Handle unknown errors
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
