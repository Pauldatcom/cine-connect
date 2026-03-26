/**
 * Refresh Use Case
 * Given a valid userId (from a verified refresh token), returns the current user.
 * Token generation and cookie update are done in the route layer.
 */

import { inject, injectable } from 'tsyringe';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { User } from '../../../domain/entities/User.js';

export interface RefreshInput {
  userId: string;
  /**
   * Refresh JWT `iat` (issued-at), as a Date — must be after the user's last password/credential change
   * or the session is treated as revoked (common enterprise practice after reset / password change).
   */
  refreshIssuedAt: Date;
}

export interface RefreshOutput {
  user: User;
}

export class RefreshError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'RefreshError';
  }
}

@injectable()
export class RefreshUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: RefreshInput): Promise<RefreshOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new RefreshError();
    }
    if (user.passwordChangedAt.getTime() > input.refreshIssuedAt.getTime()) {
      throw new RefreshError('Please sign in again');
    }
    return { user };
  }
}
