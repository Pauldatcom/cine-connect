/** Mailgun EU/US API; dev without key logs the reset URL. */

import { injectable } from 'tsyringe';

import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import type { IPasswordResetMailer } from '../../domain/services/IPasswordResetMailer.js';
import { buildForgotPasswordEmail } from './buildForgotPasswordEmail.js';

@injectable()
export class MailgunPasswordResetMailer implements IPasswordResetMailer {
  async sendResetLink(toEmail: string, resetUrl: string): Promise<void> {
    const key = env.MAILGUN_API_KEY?.trim();
    const domain = env.MAILGUN_DOMAIN?.trim();
    const from = env.MAILGUN_FROM?.trim();

    if (!key || !domain || !from) {
      if (env.NODE_ENV === 'development') {
        logger.info(
          '[password-reset] Mailgun not configured — dev reset link (do not use in prod)',
          {
            to: toEmail,
            resetUrl,
          }
        );
        return;
      }
      throw new Error('Mailgun is not configured but NODE_ENV is not development');
    }

    const base = env.MAILGUN_API_BASE.replace(/\/$/, '');
    const url = `${base}/v3/${encodeURIComponent(domain)}/messages`;
    const { subject, text, html } = buildForgotPasswordEmail(resetUrl);

    const body = new URLSearchParams();
    body.set('from', from);
    body.set('to', toEmail);
    body.set('subject', subject);
    body.set('text', text);
    body.set('html', html);

    const auth = Buffer.from(`api:${key}`, 'utf8').toString('base64');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const j = (await res.json()) as { message?: string };
        if (j?.message) detail = j.message;
      } catch {
        try {
          detail = await res.text();
        } catch {
          /* ignore */
        }
      }
      logger.error('Mailgun send failed', new Error(detail), { status: res.status });
      throw new Error(`Mailgun rejected the request: ${detail}`);
    }
  }
}
