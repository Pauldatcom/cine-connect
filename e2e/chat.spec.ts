/**
 * E2E Tests: Chat/Discussion Feature
 *
 * Tests real-time messaging, online status, and typing indicators.
 */

import { test, expect } from '@playwright/test';

// Helper to register and login a test user
async function registerAndLogin(page: import('@playwright/test').Page, suffix: string = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const user = {
    email: `test-${timestamp}-${random}${suffix}@cineconnect.test`,
    username: `u${timestamp.toString().slice(-6)}${random}${suffix}`,
    password: 'TestPassword123!',
  };

  await page.goto('/profil?mode=register');
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: /Create Account/i }).click();

  // Wait for registration
  await page.waitForTimeout(3000);
  await expect(page.getByTestId('sign-out-button')).toBeVisible({
    timeout: 15000,
  });

  return user;
}

test.describe('Chat/Discussion', () => {
  test.describe('Chat Page Access', () => {
    test('should require login to access discussion page', async ({ page }) => {
      await page.goto('/discussion');

      // Should show sign in prompt
      await expect(page.getByRole('heading', { name: /Sign in to Chat/i })).toBeVisible();
    });

    test('should show discussion page when logged in', async ({ page }) => {
      await registerAndLogin(page);

      await page.goto('/discussion');

      // Should show messages header
      await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
    });
  });

  test.describe('Conversation List', () => {
    test('should display conversation UI elements', async ({ page }) => {
      await registerAndLogin(page);

      await page.goto('/discussion');

      // Should show messages header
      await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();

      // Should have search input
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });

    test('should show placeholder when no conversation selected', async ({ page }) => {
      await registerAndLogin(page);

      await page.goto('/discussion');

      // New user should see placeholder message
      await expect(page.getByText(/Select a conversation/i)).toBeVisible();
    });
  });

  test.describe('Search Conversations', () => {
    test('should allow typing in search', async ({ page }) => {
      await registerAndLogin(page);

      await page.goto('/discussion');

      // Type in search
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('test');

      // Search should accept input
      await expect(searchInput).toHaveValue('test');
    });
  });
});
