import { describe, expect, it, vi } from 'vitest';

import { RequestPasswordResetUseCase } from '@/application/use-cases/auth/RequestPasswordResetUseCase.js';
import type { IUserRepository } from '@/domain/repositories/IUserRepository.js';
import type { IPasswordResetTokenRepository } from '@/domain/repositories/IPasswordResetTokenRepository.js';
import type { IPasswordResetMailer } from '@/domain/services/IPasswordResetMailer.js';
import type { IPasswordResetFlowUrls } from '@/domain/services/IPasswordResetFlowUrls.js';
import type { IApplicationLogger } from '@/application/ports/IApplicationLogger.js';
import { User } from '@/domain/entities/User.js';

describe('RequestPasswordResetUseCase', () => {
  const generic =
    'If an account exists for that email, you will receive password reset instructions shortly.';

  function makeDeps(overrides?: {
    userRepo?: Partial<IUserRepository>;
    tokenRepo?: Partial<IPasswordResetTokenRepository>;
    mailer?: Partial<IPasswordResetMailer>;
    flowUrls?: Partial<IPasswordResetFlowUrls>;
    appLogger?: Partial<IApplicationLogger>;
  }) {
    const userRepo = {
      findByEmail: vi.fn(),
      ...overrides?.userRepo,
    } as unknown as IUserRepository;
    const tokenRepo = {
      replaceTokenForUser: vi.fn(),
      ...overrides?.tokenRepo,
    } as unknown as IPasswordResetTokenRepository;
    const mailer = {
      sendResetLink: vi.fn(),
      ...overrides?.mailer,
    } as unknown as IPasswordResetMailer;
    const flowUrls = {
      spaOrigin: 'http://localhost:5173',
      buildPasswordResetStartUrl: vi
        .fn()
        .mockImplementation(
          (tok: string) =>
            `http://localhost:3000/api/v1/auth/reset-password/start?token=${encodeURIComponent(tok)}`
        ),
      ...overrides?.flowUrls,
    } as unknown as IPasswordResetFlowUrls;
    const appLogger = {
      error: vi.fn(),
      ...overrides?.appLogger,
    } as unknown as IApplicationLogger;
    return { userRepo, tokenRepo, mailer, flowUrls, appLogger };
  }

  it('returns generic message when email is unknown', async () => {
    const { userRepo, tokenRepo, mailer, flowUrls, appLogger } = makeDeps({
      userRepo: { findByEmail: vi.fn().mockResolvedValue(null) },
      tokenRepo: { replaceTokenForUser: vi.fn() },
    });

    const uc = new RequestPasswordResetUseCase(userRepo, tokenRepo, mailer, flowUrls, appLogger);
    const out = await uc.execute({ email: 'nobody@example.com' });

    expect(out.message).toBe(generic);
    expect(tokenRepo.replaceTokenForUser).not.toHaveBeenCalled();
    expect(mailer.sendResetLink).not.toHaveBeenCalled();
  });

  it('stores token and sends mail when user exists', async () => {
    const user = new User({
      id: 'u1',
      email: 'a@b.com',
      username: 'ab',
      passwordHash: 'x',
      passwordChangedAt: new Date(),
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const { userRepo, tokenRepo, mailer, flowUrls, appLogger } = makeDeps({
      userRepo: { findByEmail: vi.fn().mockResolvedValue(user) },
      tokenRepo: { replaceTokenForUser: vi.fn().mockResolvedValue(undefined) },
      mailer: { sendResetLink: vi.fn().mockResolvedValue(undefined) },
    });

    const uc = new RequestPasswordResetUseCase(userRepo, tokenRepo, mailer, flowUrls, appLogger);
    const out = await uc.execute({ email: 'A@B.COM' });

    expect(out.message).toBe(generic);
    expect(userRepo.findByEmail).toHaveBeenCalledWith('a@b.com');
    expect(tokenRepo.replaceTokenForUser).toHaveBeenCalledTimes(1);
    const replaceMock = vi.mocked(tokenRepo.replaceTokenForUser);
    const [uid, hash, exp] = replaceMock.mock.calls[0] as [string, string, Date];
    expect(uid).toBe('u1');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(exp.getTime()).toBeGreaterThan(Date.now());

    expect(flowUrls.buildPasswordResetStartUrl).toHaveBeenCalledTimes(1);
    const rawArg = vi.mocked(flowUrls.buildPasswordResetStartUrl).mock.calls[0]![0];
    expect(rawArg).toMatch(/^[a-f0-9]{64}$/);

    expect(mailer.sendResetLink).toHaveBeenCalledTimes(1);
    const sendMock = vi.mocked(mailer.sendResetLink);
    const [to, url] = sendMock.mock.calls[0] as [string, string];
    expect(to).toBe('a@b.com');
    expect(url).toContain('/api/v1/auth/reset-password/start?token=');
  });

  it('still returns generic message if mailer throws', async () => {
    const user = new User({
      id: 'u1',
      email: 'a@b.com',
      username: 'ab',
      passwordHash: 'x',
      passwordChangedAt: new Date(),
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const { userRepo, tokenRepo, mailer, flowUrls, appLogger } = makeDeps({
      userRepo: { findByEmail: vi.fn().mockResolvedValue(user) },
      tokenRepo: { replaceTokenForUser: vi.fn().mockResolvedValue(undefined) },
      mailer: { sendResetLink: vi.fn().mockRejectedValue(new Error('mail down')) },
    });

    const uc = new RequestPasswordResetUseCase(userRepo, tokenRepo, mailer, flowUrls, appLogger);
    const out = await uc.execute({ email: 'a@b.com' });
    expect(out.message).toBe(generic);
    expect(appLogger.error).toHaveBeenCalled();
  });
});
