/**
 * List Friends Use Case
 * Returns all accepted friends for the current user.
 */

import { inject, injectable } from 'tsyringe';

import {
  IFriendsRepository,
  type FriendWithUser,
} from '../../../domain/repositories/IFriendsRepository.js';

export interface ListFriendsInput {
  userId: string;
}

export interface ListFriendsOutput {
  friends: FriendWithUser[];
}

@injectable()
export class ListFriendsUseCase {
  constructor(
    @inject(IFriendsRepository as symbol)
    private friendsRepository: IFriendsRepository
  ) {}

  async execute(input: ListFriendsInput): Promise<ListFriendsOutput> {
    const friends = await this.friendsRepository.findFriendsWithPartners(input.userId);
    return { friends };
  }
}
