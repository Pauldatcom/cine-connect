import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

interface JwtPayload {
  userId: string;
  email: string;
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
export const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
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
export const optionalAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
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

  const accessToken = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const refreshToken = jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

  return { accessToken, refreshToken };
}
