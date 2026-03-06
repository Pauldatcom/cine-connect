/**
 * Login Use Case
 * Validates credentials and returns the user. Token generation is done in the route layer.
 */

import { inject, injectable } from 'tsyringe';
import bcrypt from 'bcryptjs';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { User } from '../../../domain/entities/User.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: User;
}

export class LoginError extends Error {
  constructor(message: string = 'Invalid email or password') {
    super(message);
    this.name = 'LoginError';
  }
}

@injectable()
export class LoginUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new LoginError();
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new LoginError();
    }

    return { user };
  }
}
