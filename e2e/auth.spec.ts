/**
 * E2E Tests: Authentication Flow
 *
 * Tests user registration, login, logout, and session persistence.
 * Auth is handled at /profil with ?mode=login or ?mode=register query params.
 */

import { test, expect } from '@playwright/test';

// Generate unique user for each test run
const generateTestUser = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return {
    email: `test-${timestamp}-${random}@cineconnect.test`,
    username: `u${timestamp.toString().slice(-6)}${random}`,
    password: 'TestPassword123!',
  };
};

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      const user = generateTestUser();

      await page.goto('/profil?mode=register');
      await expect(page.getByRole('heading', { name: /Join CineConnect/i })).toBeVisible();

      await page.getByLabel('Username').fill(user.username);
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password', { exact: true }).fill(user.password);
      await page.getByLabel('Confirm Password').fill(user.password);
      await page.getByRole('button', { name: /Create Account/i }).click();

      // Wait for registration to complete
      await page.waitForTimeout(3000);

      // Should show profile view with Sign Out button
      await expect(page.getByTestId('sign-out-button')).toBeVisible({
        timeout: 15000,
      });
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/profil?mode=register');

      await page.getByLabel('Username').fill('testuser');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password', { exact: true }).fill('short');
      await page.getByLabel('Confirm Password').fill('short');
      await page.getByRole('button', { name: /Create Account/i }).click();

      await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    });

    test('should show validation error for password mismatch', async ({ page }) => {
      await page.goto('/profil?mode=register');

      await page.getByLabel('Username').fill('testuser');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('DifferentPass123!');
      await page.getByRole('button', { name: /Create Account/i }).click();

      await expect(page.getByText(/do not match/i)).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      const user = generateTestUser();

      // Register first
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

      // Logout
      await page.getByTestId('sign-out-button').click();
      await page.waitForTimeout(1000);

      // Login
      await page.goto('/profil?mode=login');
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password').fill(user.password);
      await page.getByRole('button', { name: /Sign In/i }).click();

      // Wait for login
      await page.waitForTimeout(3000);

      // Should be logged in
      await expect(page.getByTestId('sign-out-button')).toBeVisible({
        timeout: 15000,
      });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/profil?mode=login');

      await page.getByLabel('Email').fill('nonexistent@test.com');
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: /Sign In/i }).click();

      await expect(page.getByText(/invalid|incorrect|wrong|failed|not found/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session after page refresh', async ({ page }) => {
      const user = generateTestUser();

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

      // Refresh
      await page.reload();
      await page.waitForTimeout(2000);

      // Still logged in
      await expect(page.getByTestId('sign-out-button')).toBeVisible({
        timeout: 15000,
      });
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      const user = generateTestUser();

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

      // Logout
      await page.getByTestId('sign-out-button').click();
      await page.waitForTimeout(1000);

      // Should show auth form
      await expect(
        page.getByRole('heading', { name: /Welcome Back|Join CineConnect/i })
      ).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Mode Toggle', () => {
    test('should toggle between login and register modes', async ({ page }) => {
      await page.goto('/profil?mode=login');

      await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();

      // Switch to register
      await page.getByRole('button', { name: /Create Account/i }).click();
      await expect(page.getByLabel('Username')).toBeVisible();

      // Switch back to login
      await page.getByRole('button', { name: /Sign In/i }).click();
      await expect(page.getByLabel('Username')).not.toBeVisible();
    });
  });
});
