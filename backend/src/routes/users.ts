/**
 * Users Routes
 * Uses user use-cases and IUserRepository (clean architecture)
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';

import { authenticate, getAuthUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  GetMeUseCase,
  GetUserByIdUseCase,
  UpdateProfileUseCase,
  GetMeError,
  GetUserByIdError,
  UpdateProfileError,
} from '../application/use-cases/users/index.js';

export const usersRouter = Router();

const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 */
usersRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const getMe = container.resolve(GetMeUseCase);
    const { user } = await getMe.execute({ userId: getAuthUser(req).userId });
    res.json({
      success: true,
      data: user.toPublic(),
    });
  } catch (error) {
    if (error instanceof GetMeError) {
      return next(ApiError.notFound('User not found'));
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 */
usersRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = uuidParamSchema.parse(req.params);
    const getUserById = container.resolve(GetUserByIdUseCase);
    const { user } = await getUserById.execute({ id });
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof GetUserByIdError) {
      return next(ApiError.notFound('User not found'));
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 */
usersRouter.patch('/me', authenticate, async (req, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const updateProfile = container.resolve(UpdateProfileUseCase);
    const { user } = await updateProfile.execute({
      userId: getAuthUser(req).userId,
      username: body.username,
      avatarUrl: body.avatarUrl,
    });
    res.json({
      success: true,
      data: user.toPublic(),
    });
  } catch (error) {
    if (error instanceof UpdateProfileError) {
      return next(ApiError.notFound('User not found'));
    }
    next(error);
  }
});
