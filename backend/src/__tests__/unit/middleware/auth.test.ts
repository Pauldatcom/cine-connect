import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, optionalAuth, generateTokens } from '@/middleware/auth';

// Use the same JWT_SECRET that's set in test/setup.ts
const JWT_SECRET = 'test-secret-key-for-testing-purposes-only-minimum-32-chars';
const originalJwtSecret = process.env.JWT_SECRET;

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe('authenticate', () => {
    it('should throw error when no authorization header', () => {
      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('No token provided');
    });

    it('should throw error when authorization header does not start with Bearer', () => {
      mockReq.headers = { authorization: 'Basic token123' };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('No token provided');
    });

    it('should throw error for invalid token', () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Invalid token');
    });

    it('should throw error when token is empty after Bearer', () => {
      mockReq.headers = { authorization: 'Bearer ' };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Invalid token format');
    });

    it('should set user on request for valid token', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET);
      mockReq.headers = { authorization: `Bearer ${token}` };

      authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('user-123');
      expect(mockReq.user?.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error for expired token', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' });
      mockReq.headers = { authorization: `Bearer ${token}` };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Token expired');
    });
  });

  describe('optionalAuth', () => {
    it('should call next without setting user when no token', () => {
      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next without setting user for invalid token', () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set user for valid token', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, JWT_SECRET);
      mockReq.headers = { authorization: `Bearer ${token}` };

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('user-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without error for malformed authorization header', () => {
      mockReq.headers = { authorization: 'NotBearer token' };

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without setting user when token is empty after Bearer', () => {
      mockReq.headers = { authorization: 'Bearer ' };

      optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };

      const tokens = generateTokens(payload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid JWT tokens', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };

      const tokens = generateTokens(payload);

      const decodedAccess = jwt.verify(tokens.accessToken, JWT_SECRET) as {
        userId: string;
        email: string;
      };
      const decodedRefresh = jwt.verify(tokens.refreshToken, JWT_SECRET) as {
        userId: string;
        email: string;
      };

      expect(decodedAccess.userId).toBe('user-123');
      expect(decodedAccess.email).toBe('test@example.com');
      expect(decodedRefresh.userId).toBe('user-123');
      expect(decodedRefresh.email).toBe('test@example.com');
    });
  });

  describe('missing JWT_SECRET', () => {
    afterEach(() => {
      // Restore JWT_SECRET after each test
      process.env.JWT_SECRET = originalJwtSecret;
    });

    it('should throw error when JWT_SECRET is not set for generateTokens', () => {
      delete process.env.JWT_SECRET;

      const payload = { userId: 'user-123', email: 'test@example.com' };

      expect(() => {
        generateTokens(payload);
      }).toThrow('JWT_SECRET environment variable is required');
    });

    it('should throw Invalid token when JWT_SECRET is missing during authenticate', () => {
      // When JWT_SECRET is missing, getJwtSecret throws but it's caught
      // by the try/catch and re-thrown as "Invalid token"
      delete process.env.JWT_SECRET;

      const payload = { userId: 'user-123', email: 'test@example.com' };
      const token = jwt.sign(payload, 'any-secret');
      mockReq.headers = { authorization: `Bearer ${token}` };

      expect(() => {
        authenticate(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Invalid token');
    });
  });
});
