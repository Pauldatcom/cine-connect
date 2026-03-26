import { injectable } from 'tsyringe';

import type { IApplicationLogger } from '../../application/ports/IApplicationLogger.js';
import { logger } from '../../lib/logger.js';

@injectable()
export class ConsoleApplicationLogger implements IApplicationLogger {
  error(message: string, err?: unknown, meta?: Record<string, unknown>): void {
    logger.error(message, err, meta);
  }
}
