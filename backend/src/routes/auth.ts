/**
 * Auth Routes
 * Uses auth use-cases and IUserRepository (clean architecture). Tokens and cookies are set here.
 */

import { Router, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { container } from 'tsyringe';

import { authenticate, generateTokens, getAuthUser, type JwtPayload } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  LoginUseCase,
  RegisterUseCase,
  RefreshUseCase,
  ChangePasswordUseCase,
  ChangeEmailUseCase,
  RegisterError,
  LoginError,
  RefreshError,
  ChangePasswordError,
  ChangeEmailError,
} from '../application/use-cases/auth/index.js';

export const authRouter = Router();

const REFRESH_TOKEN_COOKIE = 'cineconnect_refresh';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

/** Helper to serialize user for JSON response (no passwordHash) */
function userToResponse(user: {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
authRouter.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const registerUseCase = container.resolve(RegisterUseCase);
    const { user } = await registerUseCase.execute({
      email: body.email,
      username: body.username,
      password: body.password,
    });

    const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: userToResponse(user),
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof RegisterError) {
      return next(
        ApiError.conflict(
          error.code === 'EMAIL_TAKEN' ? 'Email already registered' : 'Username already taken'
        )
      );
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const loginUseCase = container.resolve(LoginUseCase);
    const { user } = await loginUseCase.execute({ email: body.email, password: body.password });

    const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      data: {
        user: userToResponse(user),
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof LoginError) {
      return next(ApiError.unauthorized('Invalid email or password'));
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using httpOnly cookie
 */
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw ApiError.unauthorized('No refresh token provided');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, secret) as unknown as JwtPayload;
    } catch (err) {
      clearRefreshTokenCookie(res);
      if (err instanceof jwt.TokenExpiredError) {
        return next(ApiError.unauthorized('Refresh token expired'));
      }
      return next(ApiError.unauthorized('Invalid refresh token'));
    }

    const refreshUseCase = container.resolve(RefreshUseCase);
    const { user } = await refreshUseCase.execute({ userId: decoded.userId });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
    });
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: {
        accessToken,
        user: userToResponse(user),
      },
    });
  } catch (error) {
    if (error instanceof RefreshError) {
      clearRefreshTokenCookie(res);
      return next(ApiError.unauthorized('User not found'));
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (requires current password)
 *     security:
 *       - bearerAuth: []
 */
authRouter.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const userId = getAuthUser(req).userId;
    const changePasswordUseCase = container.resolve(ChangePasswordUseCase);
    await changePasswordUseCase.execute({
      userId,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });
    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    if (error instanceof ChangePasswordError) {
      return next(ApiError.unauthorized(error.message));
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/change-email:
 *   post:
 *     tags: [Auth]
 *     summary: Change email (requires current password). Returns new tokens.
 *     security:
 *       - bearerAuth: []
 */
authRouter.post('/change-email', authenticate, async (req, res, next) => {
  try {
    const body = changeEmailSchema.parse(req.body);
    const userId = getAuthUser(req).userId;
    const changeEmailUseCase = container.resolve(ChangeEmailUseCase);
    const { user } = await changeEmailUseCase.execute({
      userId,
      newEmail: body.newEmail,
      currentPassword: body.currentPassword,
    });
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
    });
    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      data: {
        user: userToResponse(user),
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof ChangeEmailError) {
      if (error.code === 'EMAIL_TAKEN') {
        return next(ApiError.conflict('Email already in use'));
      }
      return next(ApiError.unauthorized(error.message));
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and clear refresh token cookie
 */
authRouter.post('/logout', (_req, res) => {
  clearRefreshTokenCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
