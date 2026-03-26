/**
 * Change Password Use Case
 * Verifies current password and updates to a new hashed password.
 */

import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcryptjs';

import { PASSWORD_BCRYPT_ROUNDS } from '@cine-connect/shared';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordOutput {
  success: true;
}

export class ChangePasswordError extends Error {
  constructor(message: string = 'Current password is incorrect') {
    super(message);
    this.name = 'ChangePasswordError';
  }
}

@injectable()
export class ChangePasswordUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ChangePasswordError('User not found');
    }

    const currentHash = user.passwordHash;
    if (currentHash === null) {
      throw new ChangePasswordError('This account has no password (use Google sign-in)');
    }

    const valid = await bcrypt.compare(input.currentPassword, currentHash);
    if (!valid) {
      throw new ChangePasswordError('Current password is incorrect');
    }

<<<<<<< HEAD
    const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await this.userRepository.update(input.userId, { passwordHash: newPasswordHash });
=======
    const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_BCRYPT_ROUNDS);
    const now = new Date();
    await this.userRepository.update(input.userId, { passwordHash, passwordChangedAt: now });
>>>>>>> cd2d369 (feat(auth): add passwordChangedAt and invalidate refresh after credential change)

    return { success: true };
  }
}
