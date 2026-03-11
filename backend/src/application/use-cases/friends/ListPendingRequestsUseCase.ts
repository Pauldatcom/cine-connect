/**
 * List Pending Requests Use Case
 * Returns pending friend requests received by the current user.
 */

import { inject, injectable } from 'tsyringe';

import {
  IFriendsRepository,
  type FriendRequestWithSender,
} from '../../../domain/repositories/IFriendsRepository.js';

export interface ListPendingRequestsInput {
  userId: string;
}

export interface ListPendingRequestsOutput {
  requests: FriendRequestWithSender[];
}

@injectable()
export class ListPendingRequestsUseCase {
  constructor(
    @inject(IFriendsRepository as symbol)
    private friendsRepository: IFriendsRepository
  ) {}

  async execute(input: ListPendingRequestsInput): Promise<ListPendingRequestsOutput> {
    const requests = await this.friendsRepository.findPendingRequestsForReceiver(input.userId);
    return { requests };
  }
}
