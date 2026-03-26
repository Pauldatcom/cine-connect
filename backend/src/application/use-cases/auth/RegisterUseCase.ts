/**
 * Register Use Case
 * Creates a new user account. Does not generate tokens; the route layer does that.
 */

import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcryptjs';

import { PASSWORD_BCRYPT_ROUNDS } from '@cine-connect/shared';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { User } from '../../../domain/entities/User.js';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface RegisterOutput {
  user: User;
}

export class RegisterError extends Error {
  constructor(
    message: string,
    public code: 'EMAIL_TAKEN' | 'USERNAME_TAKEN'
  ) {
    super(message);
    this.name = 'RegisterError';
  }
}

@injectable()
export class RegisterUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const existing = await this.userRepository.findByEmailOrUsername(input.email, input.username);
    if (existing) {
      if (existing.email === input.email) {
        throw new RegisterError('Email already registered', 'EMAIL_TAKEN');
      }
      throw new RegisterError('Username already taken', 'USERNAME_TAKEN');
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_BCRYPT_ROUNDS);
    const user = await this.userRepository.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });

    return { user };
  }
}
