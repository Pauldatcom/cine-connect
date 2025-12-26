/**
 * Drizzle User Repository Implementation
 */

import { injectable } from 'tsyringe';
import { eq, or } from 'drizzle-orm';

import { db, schema } from '../../db/index.js';
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { User, type CreateUserProps } from '../../domain/entities/User.js';

@injectable()
export class DrizzleUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.username, username),
    });

    return result ? this.toDomain(result) : null;
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: or(eq(schema.users.email, email), eq(schema.users.username, username)),
    });

    return result ? this.toDomain(result) : null;
  }

  async create(data: CreateUserProps): Promise<User> {
    const [result] = await db
      .insert(schema.users)
      .values({
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        avatarUrl: data.avatarUrl ?? null,
      })
      .returning();

    if (!result) {
      throw new Error('Failed to create user');
    }

    return this.toDomain(result);
  }

  async update(id: string, data: Partial<CreateUserProps>): Promise<User | null> {
    const [result] = await db
      .update(schema.users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();

    return result ? this.toDomain(result) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Map Drizzle result to domain entity
   */
  private toDomain(row: typeof schema.users.$inferSelect): User {
    return new User({
      id: row.id,
      email: row.email,
      username: row.username,
      passwordHash: row.passwordHash,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
