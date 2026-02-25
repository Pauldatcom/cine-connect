/**
 * List Messages Use Case
 * Returns paginated messages between the current user and another user, and marks them as read.
 */

import { inject, injectable } from 'tsyringe';

import {
  IMessageRepository,
  type MessageRow,
} from '../../../domain/repositories/IMessageRepository.js';

export interface ListMessagesInput {
  currentUserId: string;
  otherUserId: string;
  page: number;
  pageSize: number;
}

export interface ListMessagesOutput {
  items: MessageRow[];
  page: number;
  pageSize: number;
}

@injectable()
export class ListMessagesUseCase {
  constructor(
    @inject(IMessageRepository as symbol)
    private messageRepository: IMessageRepository
  ) {}

  async execute(input: ListMessagesInput): Promise<ListMessagesOutput> {
    // Mark messages from other user as read
    await this.messageRepository.markAsRead(input.otherUserId, input.currentUserId);

    const result = await this.messageRepository.listMessagesBetween(
      input.currentUserId,
      input.otherUserId,
      input.page,
      input.pageSize
    );
    return result;
  }
}
