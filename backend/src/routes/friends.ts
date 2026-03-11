/**
 * Friends Routes
 * Uses friends use-cases and IFriendsRepository (clean architecture)
 */

import { Router } from 'express';
import { z } from 'zod';
import { container } from 'tsyringe';

import { authenticate, getAuthUser } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import {
  ListFriendsUseCase,
  ListPendingRequestsUseCase,
  SendFriendRequestUseCase,
  RespondToFriendRequestUseCase,
  RemoveFriendUseCase,
  SendFriendRequestError,
  RespondToFriendRequestError,
  RemoveFriendError,
} from '../application/use-cases/friends/index.js';

export const friendsRouter = Router();

const sendRequestSchema = z
  .object({
    userId: z.string().uuid().optional(),
    username: z.string().min(1).max(100).optional(),
  })
  .refine(
    (data) =>
      (data.userId !== null && data.userId !== undefined) ||
      (data.username !== null && data.username !== undefined && data.username.trim() !== ''),
    {
      message: 'Provide either userId or username',
    }
  );

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
 */
friendsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const listFriends = container.resolve(ListFriendsUseCase);
    const { friends } = await listFriends.execute({ userId: getAuthUser(req).userId });
    res.json({ success: true, data: friends });
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
 */
friendsRouter.get('/requests', authenticate, async (req, res, next) => {
  try {
    const listPending = container.resolve(ListPendingRequestsUseCase);
    const { requests } = await listPending.execute({ userId: getAuthUser(req).userId });
    res.json({
      success: true,
      data: requests.map((r) => ({ id: r.id, user: r.user, createdAt: r.createdAt })),
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
 */
friendsRouter.post('/request', authenticate, async (req, res, next) => {
  try {
    const body = sendRequestSchema.parse(req.body);
    const senderId = getAuthUser(req).userId;
    const sendRequest = container.resolve(SendFriendRequestUseCase);
    const { request } = await sendRequest.execute({
      senderId,
      receiverId: body.userId,
      receiverUsername: body.username?.trim(),
    });
    res.status(201).json({ success: true, data: request });
  } catch (error) {
    if (error instanceof SendFriendRequestError) {
      if (error.code === 'SELF_REQUEST')
        return next(ApiError.badRequest('Cannot send friend request to yourself'));
      if (error.code === 'USER_NOT_FOUND') return next(ApiError.notFound('User not found'));
      if (error.code === 'ALREADY_FRIENDS') return next(ApiError.conflict('Already friends'));
      if (error.code === 'REQUEST_PENDING')
        return next(ApiError.conflict('Request already pending'));
    }
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
 */
friendsRouter.patch('/requests/:id', authenticate, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { accept } = respondRequestSchema.parse(req.body);
    const userId = getAuthUser(req).userId;
    const respond = container.resolve(RespondToFriendRequestUseCase);
    const { request } = await respond.execute({ requestId: id, userId, accept });
    res.json({ success: true, data: request });
  } catch (error) {
    if (error instanceof RespondToFriendRequestError) {
      if (error.code === 'REQUEST_NOT_FOUND') return next(ApiError.notFound('Request not found'));
      if (error.code === 'FORBIDDEN')
        return next(ApiError.forbidden('Not authorized to respond to this request'));
      if (error.code === 'ALREADY_RESPONDED')
        return next(ApiError.badRequest('Request already responded'));
    }
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
 */
friendsRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const userId = getAuthUser(req).userId;
    const remove = container.resolve(RemoveFriendUseCase);
    await remove.execute({ friendshipId: id, userId });
    res.status(204).send();
  } catch (error) {
    if (error instanceof RemoveFriendError) {
      if (error.code === 'NOT_FOUND') return next(ApiError.notFound('Friendship not found'));
      if (error.code === 'FORBIDDEN') return next(ApiError.forbidden('Not authorized'));
    }
    next(error);
  }
});
