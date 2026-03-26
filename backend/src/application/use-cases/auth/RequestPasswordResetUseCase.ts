/** Request reset: generic response; if user exists, store hashed token and email start link. */

import { randomBytes } from 'crypto';
import { inject, injectable } from 'tsyringe';

import { IApplicationLogger } from '../../ports/IApplicationLogger.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { IPasswordResetTokenRepository } from '../../../domain/repositories/IPasswordResetTokenRepository.js';
import { IPasswordResetMailer } from '../../../domain/services/IPasswordResetMailer.js';
import type { IPasswordResetFlowUrls } from '../../../domain/services/IPasswordResetFlowUrls.js';
import { IPasswordResetFlowUrls as PasswordResetFlowUrlsKey } from '../../../domain/services/IPasswordResetFlowUrls.js';
import {
  hashPasswordResetToken,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from '../../../domain/services/passwordResetToken.js';

export interface RequestPasswordResetInput {
  email: string;
}

export interface RequestPasswordResetOutput {
  /** Same message whether or not the email exists. */
  message: string;
}

@injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository,
    @inject(IPasswordResetTokenRepository as symbol)
    private tokenRepository: IPasswordResetTokenRepository,
    @inject(IPasswordResetMailer as symbol)
    private mailer: IPasswordResetMailer,
    @inject(PasswordResetFlowUrlsKey as symbol)
    private flowUrls: IPasswordResetFlowUrls,
    @inject(IApplicationLogger as symbol)
    private appLogger: IApplicationLogger
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
    const generic =
      'If an account exists for that email, you will receive password reset instructions shortly.';

    const email = input.email.trim().toLowerCase();
    if (!email) {
      return { message: generic };
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { message: generic };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await this.tokenRepository.replaceTokenForUser(user.id, tokenHash, expiresAt);

    const resetUrl = this.flowUrls.buildPasswordResetStartUrl(rawToken);

    try {
      await this.mailer.sendResetLink(user.email, resetUrl);
    } catch (err) {
      this.appLogger.error('Password reset email failed', err, { userId: user.id });
    }

    return { message: generic };
  }
}
