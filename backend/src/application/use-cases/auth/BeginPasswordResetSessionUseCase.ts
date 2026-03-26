/** Validates email-link token; does not consume it (ResetPasswordUseCase does). */

import { inject, injectable } from 'tsyringe';

import { IPasswordResetTokenRepository } from '../../../domain/repositories/IPasswordResetTokenRepository.js';
import { hashPasswordResetToken } from '../../../domain/services/passwordResetToken.js';

export type BeginPasswordResetSessionResult = { valid: true } | { valid: false };

export interface BeginPasswordResetSessionInput {
  rawToken: string;
}

@injectable()
export class BeginPasswordResetSessionUseCase {
  constructor(
    @inject(IPasswordResetTokenRepository as symbol)
    private tokenRepository: IPasswordResetTokenRepository
  ) {}

  async execute(input: BeginPasswordResetSessionInput): Promise<BeginPasswordResetSessionResult> {
    const raw = input.rawToken?.trim() ?? '';
    if (!raw) {
      return { valid: false };
    }

    const tokenHash = hashPasswordResetToken(raw);
    const row = await this.tokenRepository.findValidByTokenHash(tokenHash);
    if (!row) {
      return { valid: false };
    }

    return { valid: true };
  }
}
