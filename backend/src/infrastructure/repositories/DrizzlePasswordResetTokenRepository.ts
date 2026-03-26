import { injectable } from 'tsyringe';
import { and, eq, gt } from 'drizzle-orm';

import { db, schema } from '../../db/index.js';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/IPasswordResetTokenRepository.js';

@injectable()
export class DrizzlePasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async replaceTokenForUser(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .delete(schema.passwordResetTokens)
        .where(eq(schema.passwordResetTokens.userId, userId));
      await tx.insert(schema.passwordResetTokens).values({
        userId,
        tokenHash,
        expiresAt,
      });
    });
  }

  async findValidByTokenHash(tokenHash: string): Promise<{ id: string; userId: string } | null> {
    const row = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(schema.passwordResetTokens.tokenHash, tokenHash),
        gt(schema.passwordResetTokens.expiresAt, new Date())
      ),
    });
    if (!row) return null;
    return { id: row.id, userId: row.userId };
  }

  async deleteById(id: string): Promise<void> {
    await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.id, id));
  }
}
