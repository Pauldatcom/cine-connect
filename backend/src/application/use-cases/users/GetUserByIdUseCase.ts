/**
 * Get User By Id Use Case
 * Returns a user's public profile by id (for viewing other users).
 */

import { inject, injectable } from 'tsyringe';

import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { User } from '../../../domain/entities/User.js';

export interface GetUserByIdInput {
  id: string;
}

export interface GetUserByIdOutput {
  user: User;
}

export class GetUserByIdError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'GetUserByIdError';
  }
}

@injectable()
export class GetUserByIdUseCase {
  constructor(
    @inject(IUserRepository as symbol)
    private userRepository: IUserRepository
  ) {}

  async execute(input: GetUserByIdInput): Promise<GetUserByIdOutput> {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new GetUserByIdError();
    }
    return { user };
  }
}
