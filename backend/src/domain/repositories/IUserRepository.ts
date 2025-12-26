/**
 * User Repository Interface
 * Defines the contract for user data access
 */

import type { User, CreateUserProps } from '../entities/User.js';

export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Find user by email or username
   */
  findByEmailOrUsername(email: string, username: string): Promise<User | null>;

  /**
   * Create a new user
   */
  create(data: CreateUserProps): Promise<User>;

  /**
   * Update user
   */
  update(id: string, data: Partial<CreateUserProps>): Promise<User | null>;

  /**
   * Delete user
   */
  delete(id: string): Promise<boolean>;
}

// Token for dependency injection
export const IUserRepository = Symbol.for('IUserRepository');
