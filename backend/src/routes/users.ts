import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authenticate, getAuthUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

export const usersRouter = Router();

// Validation schemas
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
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
usersRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, getAuthUser(req).userId),
      columns: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User profile
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 */
usersRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = uuidParamSchema.parse(req.params);

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
      columns: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               avatarUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
usersRouter.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { username, avatarUrl } = updateProfileSchema.parse(req.body);

    const [updated] = await db
      .update(schema.users)
      .set({
        ...(username && { username }),
        ...(avatarUrl && { avatarUrl }),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, getAuthUser(req).userId))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        username: schema.users.username,
        avatarUrl: schema.users.avatarUrl,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});
