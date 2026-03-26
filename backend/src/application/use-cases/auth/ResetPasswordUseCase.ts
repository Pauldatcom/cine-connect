/** Completes reset with opaque token (cookie or body). */

import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcryptjs';

import { PASSWORD_BCRYPT_ROUNDS } from '@cine-connect/shared';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { IPasswordResetTokenRepository } from '../../../domain/repositories/IPasswordResetTokenRepository.js';
import { hashPasswordResetToken } from '../../../domain/services/passwordResetToken.js';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ResetPasswordOutput {
  success: true;
}

export class ResetPasswordError extends Error {
  constructor(message: string = 'Invalid or expired reset link') {
    super(message);
    this.name = 'ResetPasswordError';
  }
}

@injectable()
export class ResetPasswordUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository,
    @inject(IPasswordResetTokenRepository as symbol)
    private tokenRepository: IPasswordResetTokenRepository
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    const raw = input.token?.trim();
    if (!raw) {
      throw new ResetPasswordError();
    }

    const tokenHash = hashPasswordResetToken(raw);
    const row = await this.tokenRepository.findValidByTokenHash(tokenHash);
    if (!row) {
      throw new ResetPasswordError();
    }

    const passwordHash = await bcrypt.hash(input.newPassword, PASSWORD_BCRYPT_ROUNDS);
    const now = new Date();
    const updated = await this.userRepository.update(row.userId, {
      passwordHash,
      passwordChangedAt: now,
    });
    if (!updated) {
      throw new ResetPasswordError('User not found');
    }

    await this.tokenRepository.deleteById(row.id);

    return { success: true };
  }
}
