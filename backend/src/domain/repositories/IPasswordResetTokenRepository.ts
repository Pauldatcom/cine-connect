/**
 * Persistence for password reset tokens (hashed opaque values, short TTL).
 */

export interface IPasswordResetTokenRepository {
  /** Removes any existing rows for the user, then inserts one new token row. */
  replaceTokenForUser(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;

  /** Row still valid if token hash matches and expires_at is in the future. */
  findValidByTokenHash(tokenHash: string): Promise<{ id: string; userId: string } | null>;

  deleteById(id: string): Promise<void>;
}

export const IPasswordResetTokenRepository = Symbol.for('IPasswordResetTokenRepository');
