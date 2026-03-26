/**
 * Change Email Use Case
 * Verifies current password and updates user email. Caller should re-issue tokens after.
 */

import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcryptjs';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { User } from '../../../domain/entities/User.js';

export interface ChangeEmailInput {
  userId: string;
  newEmail: string;
  currentPassword: string;
}

export interface ChangeEmailOutput {
  user: User;
}

export class ChangeEmailError extends Error {
  constructor(
    message: string,
    public code: 'EMAIL_TAKEN' | 'INVALID_PASSWORD'
  ) {
    super(message);
    this.name = 'ChangeEmailError';
  }
}

@injectable()
export class ChangeEmailUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: ChangeEmailInput): Promise<ChangeEmailOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ChangeEmailError('User not found', 'INVALID_PASSWORD');
    }

    const currentHash = user.passwordHash;
    if (currentHash === null) {
      throw new ChangeEmailError(
        'This account uses Google sign-in; password cannot be used for this action',
        'INVALID_PASSWORD'
      );
    }

    const valid = await bcrypt.compare(input.currentPassword, currentHash);
    if (!valid) {
      throw new ChangeEmailError('Current password is incorrect', 'INVALID_PASSWORD');
    }

    const existing = await this.userRepository.findByEmail(input.newEmail);
    if (existing && existing.id !== input.userId) {
      throw new ChangeEmailError('Email already in use', 'EMAIL_TAKEN');
    }

    const updated = await this.userRepository.update(input.userId, {
      email: input.newEmail,
      passwordChangedAt: new Date(),
    });
    if (!updated) {
      throw new ChangeEmailError('Failed to update email', 'INVALID_PASSWORD');
    }

    return { user: updated };
  }
}
