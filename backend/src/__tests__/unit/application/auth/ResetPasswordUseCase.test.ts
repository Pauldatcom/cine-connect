import { describe, expect, it, vi } from 'vitest';

import {
  ResetPasswordUseCase,
  ResetPasswordError,
} from '@/application/use-cases/auth/ResetPasswordUseCase.js';
import { hashPasswordResetToken } from '@/domain/services/passwordResetToken.js';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import type { IPasswordResetTokenRepository } from '@/domain/repositories/IPasswordResetTokenRepository.js';

describe('ResetPasswordUseCase', () => {
  it('throws when token is missing', async () => {
    const uc = new ResetPasswordUseCase({} as IUserRepository, {} as IPasswordResetTokenRepository);
    await expect(uc.execute({ token: '', newPassword: 'newpass123' })).rejects.toBeInstanceOf(
      ResetPasswordError
    );
  });

  it('throws when token row not found', async () => {
    const tokenRepo = {
      findValidByTokenHash: vi.fn().mockResolvedValue(null),
    } as unknown as IPasswordResetTokenRepository;
    const uc = new ResetPasswordUseCase({} as IUserRepository, tokenRepo);
    await expect(
      uc.execute({ token: 'sometoken', newPassword: 'newpass123' })
    ).rejects.toBeInstanceOf(ResetPasswordError);
  });

  it('updates password and deletes token', async () => {
    const raw = 'opaque-token-value';
    const tokenHash = hashPasswordResetToken(raw);
    const tokenRepo = {
      findValidByTokenHash: vi
        .fn()
        .mockImplementation((h: string) =>
          h === tokenHash ? Promise.resolve({ id: 'tok1', userId: 'u1' }) : Promise.resolve(null)
        ),
      deleteById: vi.fn().mockResolvedValue(undefined),
    } as unknown as IPasswordResetTokenRepository;

    const userRepo = {
      update: vi.fn().mockResolvedValue({ id: 'u1' }),
    } as unknown as IUserRepository;

    const uc = new ResetPasswordUseCase(userRepo, tokenRepo);
    await uc.execute({ token: raw, newPassword: 'newpass123' });

    expect(userRepo.update).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        passwordHash: 'mock_hash_newpass123',
        passwordChangedAt: expect.any(Date),
      })
    );
    expect(tokenRepo.deleteById).toHaveBeenCalledWith('tok1');
  });
});
