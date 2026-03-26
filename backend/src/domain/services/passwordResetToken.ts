/** SHA-256 hex stored; raw token only in email. One-hour TTL limits interception window. */

import { createHash } from 'crypto';

export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function hashPasswordResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}
