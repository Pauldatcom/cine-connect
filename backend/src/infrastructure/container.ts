/**
 * Dependency Injection Container
 * Registers all dependencies using tsyringe
 */

import { container } from 'tsyringe';

import { IFilmRepository } from '../domain/repositories/IFilmRepository.js';
import { IFriendsRepository } from '../domain/repositories/IFriendsRepository.js';
import { IMessageRepository } from '../domain/repositories/IMessageRepository.js';
import { IReviewRepository } from '../domain/repositories/IReviewRepository.js';
import { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { IPasswordResetTokenRepository } from '../domain/repositories/IPasswordResetTokenRepository.js';
import { IPasswordResetMailer } from '../domain/services/IPasswordResetMailer.js';
import type { IPasswordResetFlowUrls } from '../domain/services/IPasswordResetFlowUrls.js';
import { IPasswordResetFlowUrls as PasswordResetFlowUrlsKey } from '../domain/services/IPasswordResetFlowUrls.js';
import type { IApplicationLogger } from '../application/ports/IApplicationLogger.js';
import { IApplicationLogger as ApplicationLoggerKey } from '../application/ports/IApplicationLogger.js';
import { ITmdbClient } from '../domain/repositories/ITmdbClient.js';
import { IWatchlistRepository } from '../domain/repositories/IWatchlistRepository.js';

import { DrizzleFilmRepository } from './repositories/DrizzleFilmRepository.js';
import { DrizzleFriendsRepository } from './repositories/DrizzleFriendsRepository.js';
import { DrizzleMessageRepository } from './repositories/DrizzleMessageRepository.js';
import { DrizzleReviewRepository } from './repositories/DrizzleReviewRepository.js';
import { DrizzleUserRepository } from './repositories/DrizzleUserRepository.js';
import { DrizzlePasswordResetTokenRepository } from './repositories/DrizzlePasswordResetTokenRepository.js';
import { MailgunPasswordResetMailer } from './email/MailgunPasswordResetMailer.js';
import { EnvPasswordResetFlowUrls } from './config/EnvPasswordResetFlowUrls.js';
import { ConsoleApplicationLogger } from './logging/ConsoleApplicationLogger.js';
import { DrizzleWatchlistRepository } from './repositories/DrizzleWatchlistRepository.js';
import { TmdbApiClient } from './tmdb/TmdbApiClient.js';
import { logger } from '../lib/logger.js';

/**
 * Register all dependencies
 * Call this once at application startup
 */
export function registerDependencies(): void {
  // Repositories
  container.registerSingleton<IUserRepository>(IUserRepository as symbol, DrizzleUserRepository);
  container.registerSingleton<IPasswordResetTokenRepository>(
    IPasswordResetTokenRepository as symbol,
    DrizzlePasswordResetTokenRepository
  );
  container.registerSingleton<IPasswordResetMailer>(
    IPasswordResetMailer as symbol,
    MailgunPasswordResetMailer
  );
  container.registerSingleton<IPasswordResetFlowUrls>(
    PasswordResetFlowUrlsKey as symbol,
    EnvPasswordResetFlowUrls
  );
  container.registerSingleton<IApplicationLogger>(
    ApplicationLoggerKey as symbol,
    ConsoleApplicationLogger
  );
  container.registerSingleton<IFilmRepository>(IFilmRepository as symbol, DrizzleFilmRepository);
  container.registerSingleton<IReviewRepository>(
    IReviewRepository as symbol,
    DrizzleReviewRepository
  );
  container.registerSingleton<IWatchlistRepository>(
    IWatchlistRepository as symbol,
    DrizzleWatchlistRepository
  );
  container.registerSingleton<IFriendsRepository>(
    IFriendsRepository as symbol,
    DrizzleFriendsRepository
  );
  container.registerSingleton<IMessageRepository>(
    IMessageRepository as symbol,
    DrizzleMessageRepository
  );
  container.registerSingleton<ITmdbClient>(ITmdbClient as symbol, TmdbApiClient);

  logger.info('[DI] Dependencies registered');
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
