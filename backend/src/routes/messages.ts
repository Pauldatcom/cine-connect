/**
 * Messages Routes
 * Uses message use-cases and IMessageRepository (clean architecture)
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';

import { authenticate, getAuthUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { IMessageRepository } from '../domain/repositories/IMessageRepository.js';
import {
  ListConversationsUseCase,
  ListMessagesUseCase,
  SendMessageUseCase,
  SendMessageError,
} from '../application/use-cases/messages/index.js';

export const messagesRouter = Router();

const sendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

const PAGE_SIZE = 50;

/**
 * @swagger
 * /api/v1/messages:
 *   get:
 *     tags: [Messages]
 *     summary: Get all conversations for current user
 *     security:
 *       - bearerAuth: []
 */
messagesRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const listConv = container.resolve(ListConversationsUseCase);
    const { conversations } = await listConv.execute({ userId: getAuthUser(req).userId });
    res.json({ success: true, data: conversations });
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
 */
messagesRouter.get('/:userId', authenticate, async (req, res, next) => {
  try {
    const currentUserId = getAuthUser(req).userId;
    const userId = z.string().uuid().parse(req.params.userId);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const listMessages = container.resolve(ListMessagesUseCase);
    const result = await listMessages.execute({
      currentUserId,
      otherUserId: userId,
      page,
      pageSize: PAGE_SIZE,
    });
    res.json({
      success: true,
      data: {
        items: result.items,
        page: result.page,
        pageSize: result.pageSize,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/messages/{userId}/read:
 *   patch:
 *     tags: [Messages]
 *     summary: Mark messages from a user as read
 *     security:
 *       - bearerAuth: []
 */
messagesRouter.patch('/:userId/read', authenticate, async (req, res, next) => {
  try {
    const currentUserId = getAuthUser(req).userId;
    const partnerId = z.string().uuid().parse(req.params.userId);
    const messageRepository = container.resolve(IMessageRepository as symbol) as IMessageRepository;
    await messageRepository.markAsRead(partnerId, currentUserId);
    res.status(200).json({ success: true });
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
 */
messagesRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { receiverId, content } = sendMessageSchema.parse(req.body);
    const senderId = getAuthUser(req).userId;
    const sendMessage = container.resolve(SendMessageUseCase);
    const { message } = await sendMessage.execute({ senderId, receiverId, content });
    res.status(201).json({
      success: true,
      data: {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        read: message.read,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof SendMessageError) {
      if (error.code === 'SELF_MESSAGE')
        return next(ApiError.badRequest('Cannot send message to yourself'));
      if (error.code === 'RECEIVER_NOT_FOUND') return next(ApiError.notFound('Receiver not found'));
    }
    next(error);
  }
});
