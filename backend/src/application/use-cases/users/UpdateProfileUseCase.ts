/**
 * Update Profile Use Case
 * Updates the current user's profile (username, avatarUrl).
 */

import { inject, injectable } from 'tsyringe';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { User } from '../../../domain/entities/User.js';

export interface UpdateProfileInput {
  userId: string;
  username?: string;
  avatarUrl?: string;
}

export interface UpdateProfileOutput {
  user: User;
}

export class UpdateProfileError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'UpdateProfileError';
  }
}

@injectable()
export class UpdateProfileUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: UpdateProfileInput): Promise<UpdateProfileOutput> {
    const updates: { username?: string; avatarUrl?: string | null } = {};
    if (input.username !== undefined) updates.username = input.username;
    if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;

    const user = await this.userRepository.update(input.userId, updates);
    if (!user) {
      throw new UpdateProfileError();
    }
    return { user };
  }
}
