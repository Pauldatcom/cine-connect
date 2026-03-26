/**
 * Sends the password-reset link (implementation may use Mailgun HTTP API).
 */

export interface IPasswordResetMailer {
  sendResetLink(toEmail: string, resetUrl: string): Promise<void>;
}

export const IPasswordResetMailer = Symbol.for('IPasswordResetMailer');
