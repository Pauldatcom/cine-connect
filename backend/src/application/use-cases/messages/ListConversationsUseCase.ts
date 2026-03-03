/**
 * List Conversations Use Case
 * Returns all conversations for the current user with last message and unread count.
 */

import { inject, injectable } from 'tsyringe';

import {
  IMessageRepository,
  type ConversationSummary,
} from '../../../domain/repositories/IMessageRepository.js';

export interface ListConversationsInput {
  userId: string;
}

export interface ListConversationsOutput {
  conversations: ConversationSummary[];
}

@injectable()
export class ListConversationsUseCase {
  constructor(
    @inject(IMessageRepository as symbol)
    private messageRepository: IMessageRepository
  ) {}

  async execute(input: ListConversationsInput): Promise<ListConversationsOutput> {
    const conversations = await this.messageRepository.listConversations(input.userId);
    return { conversations };
  }
}
