/**
 * E2E Tests: Settings page (edit profile, change email, change password)
 *
 * Set E2E_TEST_PASSWORD in backend/.env (or CI) for register/login.
 * For "change password" test, new password is a test-only literal (not a secret).
 */

import { expect, test } from '@playwright/test';

const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;
if (!E2E_PASSWORD) throw new Error('E2E_TEST_PASSWORD required (set in backend/.env or CI)');

const generateUser = () => {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 8);
  return {
    email: `settings-${t}-${r}@cineconnect.test`,
    username: `set${t.toString().slice(-6)}${r}`,
    password: E2E_PASSWORD,
  };
};

async function registerAndLogin(page: import('@playwright/test').Page) {
  const user = generateUser();
  await page.goto('/profil?mode=register');
  await expect(page.getByRole('heading', { name: /Join CineConnect/i })).toBeVisible();
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: /Create Account/i }).click();
  await expect(page.getByTestId('sign-out-button')).toBeVisible({ timeout: 15000 });
  return user;
}

test.describe('Settings page', () => {
  test('unauthenticated user is redirected to sign in', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/sign in to access settings/i)).toBeVisible({ timeout: 10000 });
    const card = page.locator('div.card').filter({ hasText: 'Sign in to access settings' });
    await expect(card.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('authenticated user sees Account settings and can update username', async ({ page }) => {
    await registerAndLogin(page);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /account settings/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('heading', { name: /^profile$/i })).toBeVisible();
    await expect(page.locator('#settings-username')).toBeVisible();
    await expect(page.getByRole('button', { name: /save profile/i })).toBeVisible();

    const usernameInput = page.locator('#settings-username');
    await usernameInput.clear();
    const uniqueUsername = `updated-${Date.now()}`;
    await usernameInput.fill(uniqueUsername);

    const patchPromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/users/me') && res.request().method() === 'PATCH',
      { timeout: 15000 }
    );
    await page.getByRole('button', { name: /save profile/i }).click();
    const response = await patchPromise;
    expect(response.status(), 'Profile update should succeed (unique username)').toBe(200);

    await expect(page.getByText('Profile updated.')).toBeVisible({ timeout: 10000 });
  });

  test('Settings link from profile navigates to /settings', async ({ page }) => {
    await registerAndLogin(page);

    await page.goto('/profil');
    await expect(page.getByTestId('sign-out-button')).toBeVisible({ timeout: 5000 });
    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: /account settings/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('Back to profile link returns to /profil', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /account settings/i })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('link', { name: /back to profile/i }).click();
    await expect(page).toHaveURL(/\/profil/);
  });

  test('can change password when current password is correct', async ({ page }) => {
    const user = await registerAndLogin(page);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible({
      timeout: 10000,
    });

    await page.locator('#settings-current-password').fill(user.password);
    await page.locator('#settings-new-password').fill('NewPassword123!');
    await page.locator('#settings-confirm-password').fill('NewPassword123!');
    await page.getByRole('button', { name: 'Change password' }).click();

    await expect(page.getByText('Password updated.')).toBeVisible({ timeout: 10000 });
  });
});
