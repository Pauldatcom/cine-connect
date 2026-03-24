/**
 * Get Me Use Case
 * Returns the current user profile by id.
 */

import { inject, injectable } from 'tsyringe';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { User } from '../../../domain/entities/User.js';

export interface GetMeInput {
  userId: string;
}

export interface GetMeOutput {
  user: User;
}

export class GetMeError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'GetMeError';
  }
}

@injectable()
export class GetMeUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: GetMeInput): Promise<GetMeOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new GetMeError();
    }
    return { user };
  }
}
