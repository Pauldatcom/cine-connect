/**
 * Change Password Use Case
 * Verifies current password and updates to a new hashed password.
 */

import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcryptjs';

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

const BCRYPT_ROUNDS = 12;

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

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new ChangePasswordError('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await this.userRepository.update(input.userId, { passwordHash });

    return { success: true };
  }
}
