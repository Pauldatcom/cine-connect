import { Router } from 'express';
import { z } from 'zod';
import { eq, and, or } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authenticate, getAuthUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

export const friendsRouter = Router();

// Validation schemas
const sendRequestSchema = z.object({
  userId: z.string().uuid(),
});

const respondRequestSchema = z.object({
  accept: z.boolean(),
});

/**
 * @swagger
 * /api/v1/friends:
 *   get:
 *     tags: [Friends]
 *     summary: Get all friends
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friends
 */
friendsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = getAuthUser(req).userId;

    const friendships = await db.query.friends.findMany({
      where: and(
        or(eq(schema.friends.senderId, userId), eq(schema.friends.receiverId, userId)),
        eq(schema.friends.status, 'accepted')
      ),
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        receiver: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Map to friend objects
    const friends = friendships.map((f) => ({
      id: f.id,
      user: f.senderId === userId ? f.receiver : f.sender,
      since: f.updatedAt,
    }));

    res.json({
      success: true,
      data: friends,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/friends/requests:
 *   get:
 *     tags: [Friends]
 *     summary: Get pending friend requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 */
friendsRouter.get('/requests', authenticate, async (req, res, next) => {
  try {
    const userId = getAuthUser(req).userId;

    const requests = await db.query.friends.findMany({
      where: and(eq(schema.friends.receiverId, userId), eq(schema.friends.status, 'pending')),
      with: {
        sender: {
          columns: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        user: r.sender,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/friends/request:
 *   post:
 *     tags: [Friends]
 *     summary: Send a friend request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Request sent
 */
friendsRouter.post('/request', authenticate, async (req, res, next) => {
  try {
    const { userId: receiverId } = sendRequestSchema.parse(req.body);
    const senderId = getAuthUser(req).userId;

    if (senderId === receiverId) {
      throw ApiError.badRequest('Cannot send friend request to yourself');
    }

    // Check if user exists
    const receiver = await db.query.users.findFirst({
      where: eq(schema.users.id, receiverId),
    });

    if (!receiver) {
      throw ApiError.notFound('User not found');
    }

    // Check for existing friendship/request
    const existing = await db.query.friends.findFirst({
      where: or(
        and(eq(schema.friends.senderId, senderId), eq(schema.friends.receiverId, receiverId)),
        and(eq(schema.friends.senderId, receiverId), eq(schema.friends.receiverId, senderId))
      ),
    });

    if (existing) {
      if (existing.status === 'accepted') {
        throw ApiError.conflict('Already friends');
      }
      if (existing.status === 'pending') {
        throw ApiError.conflict('Request already pending');
      }
    }

    // Create friend request
    const [request] = await db
      .insert(schema.friends)
      .values({
        senderId,
        receiverId,
        status: 'pending',
      })
      .returning();

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/friends/requests/{id}:
 *   patch:
 *     tags: [Friends]
 *     summary: Accept or reject a friend request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accept]
 *             properties:
 *               accept:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Request responded
 */
friendsRouter.patch('/requests/:id', authenticate, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { accept } = respondRequestSchema.parse(req.body);
    const userId = getAuthUser(req).userId;

    // Find request
    const request = await db.query.friends.findFirst({
      where: eq(schema.friends.id, id),
    });

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.receiverId !== userId) {
      throw ApiError.forbidden('Not authorized to respond to this request');
    }

    if (request.status !== 'pending') {
      throw ApiError.badRequest('Request already responded');
    }

    // Update request
    const [updated] = await db
      .update(schema.friends)
      .set({
        status: accept ? 'accepted' : 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(schema.friends.id, id))
      .returning();

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/friends/{id}:
 *   delete:
 *     tags: [Friends]
 *     summary: Remove a friend
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Friend removed
 */
friendsRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const userId = getAuthUser(req).userId;

    // Find friendship
    const friendship = await db.query.friends.findFirst({
      where: eq(schema.friends.id, id),
    });

    if (!friendship) {
      throw ApiError.notFound('Friendship not found');
    }

    if (friendship.senderId !== userId && friendship.receiverId !== userId) {
      throw ApiError.forbidden('Not authorized');
    }

    await db.delete(schema.friends).where(eq(schema.friends.id, id));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
