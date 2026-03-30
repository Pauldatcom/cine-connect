import { describe, expect, it } from 'vitest';

import { hashPasswordResetToken } from '@/domain/services/passwordResetToken.js';

describe('hashPasswordResetToken', () => {
  it('returns 64-char hex and is stable for same input', () => {
    const h = hashPasswordResetToken('abc');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(hashPasswordResetToken('abc')).toBe(h);
  });
});
