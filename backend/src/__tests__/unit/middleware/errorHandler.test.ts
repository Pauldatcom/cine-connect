import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { ApiError, errorHandler } from '@/middleware/errorHandler';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create an error with statusCode and message', () => {
      const error = new ApiError(400, 'Bad request');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.isOperational).toBe(true);
    });

    it('should allow setting isOperational to false', () => {
      const error = new ApiError(500, 'Internal error', false);

      expect(error.isOperational).toBe(false);
    });
  });

  describe('static factory methods', () => {
    it('should create badRequest error', () => {
      const error = ApiError.badRequest('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should create unauthorized error', () => {
      const error = ApiError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should create unauthorized error with custom message', () => {
      const error = ApiError.unauthorized('Token expired');

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Token expired');
    });

    it('should create forbidden error', () => {
      const error = ApiError.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should create notFound error', () => {
      const error = ApiError.notFound();

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
    });

    it('should create notFound error with custom message', () => {
      const error = ApiError.notFound('User not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create conflict error', () => {
      const error = ApiError.conflict('Email already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Email already exists');
    });

    it('should create internal error', () => {
      const error = ApiError.internal();

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
      expect(error.isOperational).toBe(false);
    });
  });
});

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle ZodError', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    let zodError: ZodError | null = null;
    try {
      schema.parse({ email: 'invalid', password: '123' });
    } catch (e) {
      zodError = e as ZodError;
    }

    errorHandler(zodError!, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation error',
        details: expect.any(Array),
      })
    );
  });

  it('should handle ApiError', () => {
    const error = ApiError.notFound('User not found');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'User not found',
    });
  });

  it('should handle unknown errors in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const error = new Error('Something went wrong');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Something went wrong',
    });
  });

  it('should hide error details in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const error = new Error('Sensitive error details');

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });
  });
});
