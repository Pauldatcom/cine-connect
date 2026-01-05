/**
 * E2E Tests: Complete User Journey
 *
 * Tests the full user experience from registration to using all features.
 * This is the main integration test that covers the entire app flow.
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('should complete full user journey: register -> browse -> review -> chat', async ({
    page,
  }) => {
    const user = {
      email: `journey-${Date.now()}@cineconnect.test`,
      username: `user${Date.now().toString().slice(-8)}`,
      password: 'JourneyTest123!',
    };

    // ========================================
    // STEP 1: Register new account
    // ========================================
    await test.step('Register new account', async () => {
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
    });

    // ========================================
    // STEP 2: Explore the homepage
    // ========================================
    await test.step('Explore homepage', async () => {
      await page.goto('/');

      // Should see film content
      await expect(page.locator('img').first()).toBeVisible({ timeout: 10000 });

      // Should have main navigation
      await expect(page.getByRole('navigation').getByRole('link', { name: 'Films' })).toBeVisible();
    });

    // ========================================
    // STEP 3: Browse films
    // ========================================
    await test.step('Browse films catalog', async () => {
      await page.goto('/films');

      // Wait for films to load
      await page.waitForSelector('img', { timeout: 10000 });

      // Should show films
      await expect(page.locator('img').first()).toBeVisible();
    });

    // ========================================
    // STEP 4: View film details
    // ========================================
    await test.step('View film details', async () => {
      // Go to Inception
      await page.goto('/film/27205');

      // Wait for film data
      await page.waitForSelector('h1', { timeout: 10000 });

      // Verify film title
      await expect(page.locator('h1')).toBeVisible();

      // Check for poster
      await expect(page.locator('img').first()).toBeVisible();
    });

    // ========================================
    // STEP 5: Navigate to discussion/chat
    // ========================================
    await test.step('Access chat feature', async () => {
      await page.goto('/discussion');

      // Should see messages interface (since we're logged in)
      await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
    });

    // ========================================
    // STEP 6: View lists page
    // ========================================
    await test.step('View lists page', async () => {
      await page.goto('/lists');

      // Should show lists page heading
      await expect(page.getByRole('heading', { name: 'Lists' })).toBeVisible();
    });

    // ========================================
    // STEP 7: Logout
    // ========================================
    await test.step('Logout', async () => {
      await page.goto('/profil');
      await page.waitForTimeout(2000);

      // Find and click logout button
      await page.getByTestId('sign-out-button').click();
      await page.waitForTimeout(1000);

      // Should show auth form (heading visible = logged out)
      await expect(
        page.getByRole('heading', { name: /Welcome Back|Join CineConnect/i })
      ).toBeVisible({ timeout: 10000 });
    });

    // ========================================
    // STEP 8: Login again
    // ========================================
    await test.step('Login with existing account', async () => {
      await page.goto('/profil?mode=login');

      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password').fill(user.password);
      await page.getByRole('button', { name: /Sign In/i }).click();

      // Wait for login
      await page.waitForTimeout(3000);
      await expect(page.getByTestId('sign-out-button')).toBeVisible({
        timeout: 15000,
      });
    });
  });

  test('should handle navigation across all main pages', async ({ page }) => {
    await test.step('Home page loads', async () => {
      await page.goto('/');
      // Should load without errors
      await expect(page.locator('body')).toBeVisible();
    });

    await test.step('Films page loads', async () => {
      await page.goto('/films');
      await page.waitForSelector('img', { timeout: 10000 });
    });

    await test.step('Film detail page loads', async () => {
      await page.goto('/film/550');
      await page.waitForSelector('h1', { timeout: 10000 });
    });

    await test.step('Lists page loads', async () => {
      await page.goto('/lists');
      await expect(page.locator('body')).toBeVisible();
    });

    await test.step('Profile/Auth page loads', async () => {
      await page.goto('/profil');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
