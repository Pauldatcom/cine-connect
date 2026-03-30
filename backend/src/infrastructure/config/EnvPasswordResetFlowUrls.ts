import { injectable } from 'tsyringe';

import { env } from '../../config/env.js';
import type { IPasswordResetFlowUrls } from '../../domain/services/IPasswordResetFlowUrls.js';

@injectable()
export class EnvPasswordResetFlowUrls implements IPasswordResetFlowUrls {
  readonly spaOrigin: string;

  constructor() {
    this.spaOrigin = env.FRONTEND_URL.replace(/\/$/, '');
  }

  buildPasswordResetStartUrl(rawOpaqueToken: string): string {
    const apiBase = env.API_PUBLIC_URL.replace(/\/$/, '');
    return `${apiBase}/api/v1/auth/reset-password/start?token=${encodeURIComponent(rawOpaqueToken)}`;
  }
}
