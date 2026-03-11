/**
 * Simple backend logger: consistent prefix and levels so errors stand out.
 * Use for request logs, auth/refresh failures, and unexpected errors.
 */

const PREFIX = '[backend]';

export const logger = {
  /** Normal operations (e.g. request completed, socket connected). */
  info(message: string, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`${PREFIX} ${message}${extra}`);
  },

  /** Expected failures (4xx, missing refresh token, validation). One line, no stack. */
  warn(message: string, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`${PREFIX} [WARN] ${message}${extra}`);
  },

  /** Unexpected errors (5xx, unhandled exceptions). Log message and stack. */
  error(message: string, err?: unknown, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    console.error(`${PREFIX} [ERROR] ${message}${extra}`);
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    } else if (err !== undefined) {
      console.error(err);
    }
  },
};
