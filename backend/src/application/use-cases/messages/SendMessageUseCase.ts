/**
 * Send Message Use Case
 * Sends a message from the current user to another user.
 */

import { inject, injectable } from 'tsyringe';

import {
  IMessageRepository,
  type MessageRow,
} from '../../../domain/repositories/IMessageRepository.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export interface SendMessageInput {
  senderId: string;
  receiverId: string;
  content: string;
}

export interface SendMessageOutput {
  message: MessageRow;
}

export class SendMessageError extends Error {
  constructor(
    message: string,
    public code: 'SELF_MESSAGE' | 'RECEIVER_NOT_FOUND'
  ) {
    super(message);
    this.name = 'SendMessageError';
  }
}

@injectable()
export class SendMessageUseCase {
  constructor(
    @inject(IMessageRepository as symbol)
    private messageRepository: IMessageRepository,
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    if (input.senderId === input.receiverId) {
      throw new SendMessageError('Cannot send message to yourself', 'SELF_MESSAGE');
    }

    const receiver = await this.userRepository.findById(input.receiverId);
    if (!receiver) {
      throw new SendMessageError('Receiver not found', 'RECEIVER_NOT_FOUND');
    }

    const message = await this.messageRepository.create(
      input.senderId,
      input.receiverId,
      input.content
    );
    return { message };
  }
}
