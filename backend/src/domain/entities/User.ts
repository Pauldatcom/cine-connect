/**
 * User Domain Entity
 * Pure domain model - no framework dependencies
 */

export interface UserProps {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: string;
  username: string;
  passwordHash: string;
  avatarUrl?: string | null;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly avatarUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.avatarUrl = props.avatarUrl;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Returns a public-safe representation (no password hash)
   */
  toPublic(): Omit<UserProps, 'passwordHash'> {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      avatarUrl: this.avatarUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Returns minimal user info for embedding in other entities
   */
  toSummary(): { id: string; username: string; avatarUrl: string | null } {
    return {
      id: this.id,
      username: this.username,
      avatarUrl: this.avatarUrl,
    };
  }
}
