import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Get authenticated user from request - throws if not authenticated
 * Use this in routes that use the authenticate middleware
 */
export function getAuthUser(req: Request): JwtPayload {
  if (!req.user) {
    throw ApiError.unauthorized('User not authenticated');
  }
  return req.user;
}

/**
 * Try to get authenticated user from request - returns undefined if not authenticated
 * Use this in routes that use optionalAuth middleware
 */
export function tryGetAuthUser(req: Request): JwtPayload | undefined {
  return req.user;
}

// Extend Express Request to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Get JWT secret from environment - throws if not set
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Middleware to verify JWT token
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw ApiError.unauthorized('Invalid token format');
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token expired');
    }
    throw ApiError.unauthorized('Invalid token');
  }
};

/**
 * Optional authentication - doesn't throw if no token
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as JwtPayload;
    req.user = decoded;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

/**
 * Generate JWT tokens
 */
export function generateTokens(payload: JwtPayload) {
  const secret = getJwtSecret();
  const accessExpiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '30d';

  const accessToken = jwt.sign(payload, secret, {
    expiresIn: accessExpiresIn,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, secret, {
    expiresIn: refreshExpiresIn,
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
}
