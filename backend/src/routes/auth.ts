import { Router, type Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { generateTokens, type JwtPayload } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

export const authRouter = Router();

// Cookie configuration for refresh token
const REFRESH_TOKEN_COOKIE = 'cineconnect_refresh';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

/**
 * Set refresh token as httpOnly cookie
 */
function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear refresh token cookie
 */
function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 */
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, username, password } = registerSchema.parse(req.body);

    // Check if email or username already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { or }) => or(eq(users.email, email), eq(users.username, username)),
    });

    if (existingUser) {
      throw ApiError.conflict(
        existingUser.email === email ? 'Email already registered' : 'Username already taken'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await db
      .insert(schema.users)
      .values({
        email,
        username,
        passwordHash,
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        username: schema.users.username,
        avatarUrl: schema.users.avatarUrl,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      });

    const user = result[0];
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });

    // Set refresh token as httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken,
        // Note: refreshToken is now in httpOnly cookie, not in response body
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({ userId: user.id, email: user.email });

    // Set refresh token as httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        // Note: refreshToken is now in httpOnly cookie, not in response body
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using httpOnly cookie
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
authRouter.post('/refresh', async (req, res, next) => {
  try {
    // Get refresh token from httpOnly cookie
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw ApiError.unauthorized('No refresh token provided');
    }

    // Verify refresh token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, secret) as unknown as JwtPayload;
    } catch (error) {
      // Clear invalid cookie
      clearRefreshTokenCookie(res);
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Refresh token expired');
      }
      throw ApiError.unauthorized('Invalid refresh token');
    }

    // Verify user still exists
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, decoded.userId),
    });

    if (!user) {
      clearRefreshTokenCookie(res);
      throw ApiError.unauthorized('User not found');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
    });

    // Update refresh token cookie
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and clear refresh token cookie
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
authRouter.post('/logout', (_req, res) => {
  clearRefreshTokenCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
