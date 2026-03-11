/**
 * Remove Friend Use Case
 * Removes a friendship (either user can remove).
 */

import { inject, injectable } from 'tsyringe';

import { IFriendsRepository } from '../../../domain/repositories/IFriendsRepository.js';

export interface RemoveFriendInput {
  friendshipId: string;
  userId: string;
}

export interface RemoveFriendOutput {
  removed: true;
}

export class RemoveFriendError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'RemoveFriendError';
  }
}

@injectable()
export class RemoveFriendUseCase {
  constructor(
    @inject(IFriendsRepository as symbol)
    private friendsRepository: IFriendsRepository
  ) {}

  async execute(input: RemoveFriendInput): Promise<RemoveFriendOutput> {
    const friendship = await this.friendsRepository.findById(input.friendshipId);
    if (!friendship) {
      throw new RemoveFriendError('Friendship not found', 'NOT_FOUND');
    }
    if (friendship.senderId !== input.userId && friendship.receiverId !== input.userId) {
      throw new RemoveFriendError('Not authorized', 'FORBIDDEN');
    }

    await this.friendsRepository.delete(input.friendshipId);
    return { removed: true };
  }
}
