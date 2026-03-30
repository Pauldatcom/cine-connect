import { describe, expect, it, vi } from 'vitest';

import { BeginPasswordResetSessionUseCase } from '@/application/use-cases/auth/BeginPasswordResetSessionUseCase.js';
import { hashPasswordResetToken } from '@/domain/services/passwordResetToken.js';
import type { IPasswordResetTokenRepository } from '@/domain/repositories/IPasswordResetTokenRepository.js';

describe('BeginPasswordResetSessionUseCase', () => {
  it('returns invalid when token empty', async () => {
    const tokenRepo = { findValidByTokenHash: vi.fn() } as unknown as IPasswordResetTokenRepository;
    const uc = new BeginPasswordResetSessionUseCase(tokenRepo);
    await expect(uc.execute({ rawToken: '' })).resolves.toEqual({ valid: false });
    await expect(uc.execute({ rawToken: '   ' })).resolves.toEqual({ valid: false });
    expect(tokenRepo.findValidByTokenHash).not.toHaveBeenCalled();
  });

  it('returns invalid when no row matches', async () => {
    const tokenRepo = {
      findValidByTokenHash: vi.fn().mockResolvedValue(null),
    } as unknown as IPasswordResetTokenRepository;
    const uc = new BeginPasswordResetSessionUseCase(tokenRepo);
    await expect(uc.execute({ rawToken: 'sometoken' })).resolves.toEqual({ valid: false });
  });

  it('returns valid when row exists', async () => {
    const raw = 'opaque-token-value';
    const tokenHash = hashPasswordResetToken(raw);
    const tokenRepo = {
      findValidByTokenHash: vi
        .fn()
        .mockImplementation((h: string) =>
          h === tokenHash ? Promise.resolve({ id: 'tok1', userId: 'u1' }) : Promise.resolve(null)
        ),
    } as unknown as IPasswordResetTokenRepository;
    const uc = new BeginPasswordResetSessionUseCase(tokenRepo);
    await expect(uc.execute({ rawToken: raw })).resolves.toEqual({ valid: true });
  });
});
