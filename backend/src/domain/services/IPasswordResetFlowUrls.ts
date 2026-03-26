/**
 * Port: URLs for the password-reset flow (SPA origin + API start link in emails).
 * Implemented in infrastructure from environment.
 */

export interface IPasswordResetFlowUrls {
  /** SPA origin without trailing slash (redirect targets). */
  readonly spaOrigin: string;

  /** Full URL the user opens from email; hits API then redirects to SPA. */
  buildPasswordResetStartUrl(rawOpaqueToken: string): string;
}

export const IPasswordResetFlowUrls = Symbol.for('IPasswordResetFlowUrls');
