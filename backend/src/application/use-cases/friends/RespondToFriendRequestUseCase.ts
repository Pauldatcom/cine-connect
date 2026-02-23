/**
 * Respond To Friend Request Use Case
 * Accept or reject a pending friend request (only the receiver can respond).
 */

import { inject, injectable } from 'tsyringe';

import { IFriendsRepository } from '../../../domain/repositories/IFriendsRepository.js';

export interface RespondToFriendRequestInput {
  requestId: string;
  userId: string; // must be the receiver
  accept: boolean;
}

export interface RespondToFriendRequestOutput {
  request: {
    id: string;
    senderId: string;
    receiverId: string;
    status: string;
    updatedAt: Date;
  };
}

export class RespondToFriendRequestError extends Error {
  constructor(
    message: string,
    public code: 'REQUEST_NOT_FOUND' | 'FORBIDDEN' | 'ALREADY_RESPONDED'
  ) {
    super(message);
    this.name = 'RespondToFriendRequestError';
  }
}

@injectable()
export class RespondToFriendRequestUseCase {
  constructor(
    @inject(IFriendsRepository as symbol)
    private friendsRepository: IFriendsRepository
  ) {}

  async execute(input: RespondToFriendRequestInput): Promise<RespondToFriendRequestOutput> {
    const request = await this.friendsRepository.findById(input.requestId);
    if (!request) {
      throw new RespondToFriendRequestError('Request not found', 'REQUEST_NOT_FOUND');
    }
    if (request.receiverId !== input.userId) {
      throw new RespondToFriendRequestError(
        'Not authorized to respond to this request',
        'FORBIDDEN'
      );
    }
    if (request.status !== 'pending') {
      throw new RespondToFriendRequestError('Request already responded', 'ALREADY_RESPONDED');
    }

    const status = input.accept ? 'accepted' : 'rejected';
    const updated = await this.friendsRepository.updateStatus(input.requestId, status);
    if (!updated) {
      throw new RespondToFriendRequestError('Request not found', 'REQUEST_NOT_FOUND');
    }
    return { request: updated };
  }
}
