/**
 * Application logging port — use cases log through this, not console or lib/logger.
 */

export interface IApplicationLogger {
  error(message: string, err?: unknown, meta?: Record<string, unknown>): void;
}

export const IApplicationLogger = Symbol.for('IApplicationLogger');
