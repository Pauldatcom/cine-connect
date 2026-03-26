import { describe, expect, it } from 'vitest';

import { buildForgotPasswordEmail } from '@/infrastructure/email/buildForgotPasswordEmail.js';

describe('buildForgotPasswordEmail', () => {
  it('injects reset URL into html and text', () => {
    const url = 'https://api.example.com/start?token=abc&x=1';
    const { subject, text, html } = buildForgotPasswordEmail(url);

    expect(subject).toContain('CinéConnect');
    expect(text).toContain(url);
    expect(html).toContain('href="https://api.example.com/start?token=abc&amp;x=1"');
    expect(html).toContain('abc&amp;x=1');
  });
});
