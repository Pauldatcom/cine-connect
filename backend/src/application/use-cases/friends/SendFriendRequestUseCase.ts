/**
 * Send Friend Request Use Case
 * Sends a friend request from the current user to another user.
 */

import { inject, injectable } from 'tsyringe';

import { IFriendsRepository } from '../../../domain/repositories/IFriendsRepository.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export interface SendFriendRequestInput {
  senderId: string;
  /** Resolve by ID (preferred) or by username */
  receiverId?: string;
  receiverUsername?: string;
}

export interface SendFriendRequestOutput {
  request: {
    id: string;
    senderId: string;
    receiverId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class SendFriendRequestError extends Error {
  constructor(
    message: string,
    public code: 'SELF_REQUEST' | 'USER_NOT_FOUND' | 'ALREADY_FRIENDS' | 'REQUEST_PENDING'
  ) {
    super(message);
    this.name = 'SendFriendRequestError';
  }
}

@injectable()
export class SendFriendRequestUseCase {
  constructor(
    @inject(IFriendsRepository as symbol)
    private friendsRepository: IFriendsRepository,
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: SendFriendRequestInput): Promise<SendFriendRequestOutput> {
    let receiverId = input.receiverId;
    if (
      (receiverId === null || receiverId === undefined) &&
      input.receiverUsername !== null &&
      input.receiverUsername !== undefined
    ) {
      const byUsername = await this.userRepository.findByUsername(input.receiverUsername.trim());
      if (!byUsername) {
        throw new SendFriendRequestError('User not found', 'USER_NOT_FOUND');
      }
      receiverId = byUsername.id;
    }
    if (receiverId === null || receiverId === undefined) {
      throw new SendFriendRequestError('User not found', 'USER_NOT_FOUND');
    }

    if (input.senderId === receiverId) {
      throw new SendFriendRequestError('Cannot send friend request to yourself', 'SELF_REQUEST');
    }

    const receiver = await this.userRepository.findById(receiverId);
    if (!receiver) {
      throw new SendFriendRequestError('User not found', 'USER_NOT_FOUND');
    }

    const existing = await this.friendsRepository.findExistingBetween(input.senderId, receiverId);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new SendFriendRequestError('Already friends', 'ALREADY_FRIENDS');
      }
      if (existing.status === 'pending') {
        throw new SendFriendRequestError('Request already pending', 'REQUEST_PENDING');
      }
    }

    const request = await this.friendsRepository.create(input.senderId, receiverId, 'pending');
    return { request };
  }
}
