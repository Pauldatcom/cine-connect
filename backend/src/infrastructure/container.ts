/**
 * Dependency Injection Container
 * Registers all dependencies using tsyringe
 */

import { container } from 'tsyringe';

import { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { IFilmRepository } from '../domain/repositories/IFilmRepository.js';
import { IReviewRepository } from '../domain/repositories/IReviewRepository.js';

import { DrizzleUserRepository } from './repositories/DrizzleUserRepository.js';
import { DrizzleFilmRepository } from './repositories/DrizzleFilmRepository.js';
import { DrizzleReviewRepository } from './repositories/DrizzleReviewRepository.js';

/**
 * Register all dependencies
 * Call this once at application startup
 */
export function registerDependencies(): void {
  // Repositories
  container.registerSingleton<IUserRepository>(IUserRepository as symbol, DrizzleUserRepository);
  container.registerSingleton<IFilmRepository>(IFilmRepository as symbol, DrizzleFilmRepository);
  container.registerSingleton<IReviewRepository>(
    IReviewRepository as symbol,
    DrizzleReviewRepository
  );

  console.log('[DI] Dependencies registered');
}

/**
 * Resolve a dependency from the container
 */
export function resolve<T>(token: symbol): T {
  return container.resolve<T>(token);
}

/**
 * Export the container for direct access if needed
 */
export { container };
