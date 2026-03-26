/**
 * Renders forgot-password transactional email from templates + reset URL placeholders.
 */

import { loadEmailTemplate } from './loadEmailTemplate.js';

const SUBJECT = 'Reset your CinéConnect password';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildForgotPasswordEmail(resetUrl: string): {
  subject: string;
  text: string;
  html: string;
} {
  const safeUrl = escapeHtml(resetUrl);
  const html = loadEmailTemplate('forgot-password.html').replaceAll(
    '{{RESET_URL_ESCAPED}}',
    safeUrl
  );
  const text = loadEmailTemplate('forgot-password.txt').replaceAll('{{RESET_URL}}', resetUrl);
  return { subject: SUBJECT, text, html };
}
