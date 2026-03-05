import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '@cine-connect/shared';
import { logger } from '../lib/logger.js';

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
 * Global error handler middleware.
 * 4xx (expected): one-line warn, no stack. 5xx / unknown: full error log.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const method = req.method;
  const path = req.path ?? req.url ?? '';

  // Handle Zod validation errors — log short, no stack
  if (err instanceof ZodError) {
    logger.warn(`400 Validation error — ${method} ${path}`, {
      paths: err.errors.map((e) => e.path.join('.')),
    });
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

  // Handle API errors: 4xx = warn one line, 5xx = full error
  if (err instanceof ApiError) {
    const isExpectedRefreshUnauth =
      err.statusCode === HTTP_STATUS.UNAUTHORIZED &&
      path.includes('auth/refresh') &&
      err.message === 'No refresh token provided';

    if (err.statusCode < 500) {
      if (isExpectedRefreshUnauth) {
        logger.info(`${err.statusCode} ${err.message} — ${method} ${path}`);
      } else {
        logger.warn(`${err.statusCode} ${err.message} — ${method} ${path}`);
      }
    } else {
      logger.error(`${err.statusCode} ${err.message} — ${method} ${path}`, err);
    }
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Unknown errors: always full log
  logger.error(`Unhandled error — ${method} ${path}`, err);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : ((err as Error)?.message ?? 'Unknown error'),
  });
};
