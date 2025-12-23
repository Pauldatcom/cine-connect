import { Router } from 'express';
import { z } from 'zod';
import { eq, and, or, desc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

export const messagesRouter = Router();

// Validation schemas
const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

/**
 * @swagger
 * /api/v1/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Get all conversations for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
messagesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    // Get all unique conversations
    const messages = await db.query.messages.findMany({
      where: or(eq(schema.messages.senderId, userId), eq(schema.messages.receiverId, userId)),
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
      orderBy: [desc(schema.messages.createdAt)],
    });

    // Group by conversation partner
    const conversationsMap = new Map<
      string,
      {
        partnerId: string;
        partner: { id: string; username: string; avatarUrl: string | null };
        lastMessage: (typeof messages)[0];
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      if (msg.receiverId === userId && !msg.read) {
        const conv = conversationsMap.get(partnerId)!;
        conv.unreadCount++;
      }
    }

    res.json({
      success: true,
      data: Array.from(conversationsMap.values()),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/messages/{userId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get messages with a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of messages
 */
messagesRouter.get('/:userId', authenticate, async (req, res, next) => {
  try {
    const currentUserId = req.user!.userId;
    const userId = z.string().uuid().parse(req.params.userId);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 50;
    const offset = (page - 1) * limit;

    const messages = await db.query.messages.findMany({
      where: or(
        and(eq(schema.messages.senderId, currentUserId), eq(schema.messages.receiverId, userId)),
        and(eq(schema.messages.senderId, userId), eq(schema.messages.receiverId, currentUserId))
      ),
      orderBy: [desc(schema.messages.createdAt)],
      limit,
      offset,
    });

    // Mark messages as read
    await db
      .update(schema.messages)
      .set({ read: true })
      .where(
        and(
          eq(schema.messages.senderId, userId),
          eq(schema.messages.receiverId, currentUserId),
          eq(schema.messages.read, false)
        )
      );

    res.json({
      success: true,
      data: {
        items: messages.reverse(), // Return in chronological order
        page,
        pageSize: limit,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     tags: [Messages]
 *     summary: Send a message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, content]
 *             properties:
 *               receiverId:
 *                 type: string
 *                 format: uuid
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
messagesRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { receiverId, content } = sendMessageSchema.parse(req.body);
    const senderId = req.user!.userId;

    if (senderId === receiverId) {
      throw ApiError.badRequest('Cannot send message to yourself');
    }

    // Check if receiver exists
    const receiver = await db.query.users.findFirst({
      where: eq(schema.users.id, receiverId),
    });

    if (!receiver) {
      throw ApiError.notFound('Receiver not found');
    }

    // Create message
    const [message] = await db
      .insert(schema.messages)
      .values({
        senderId,
        receiverId,
        content,
      })
      .returning();

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
});
