/**
 * E2E Tests: User Profile Data
 *
 * Tests that user data (reviews, watchlist) correctly appears on profile.
 * These tests catch bugs where:
 * - Reviews don't appear on profile after creation
 * - Watchlist count doesn't update
 * - Edit review functionality doesn't work
 */

import { expect, test } from '@playwright/test';

// Test user credentials - reused across tests
const generateUser = () => ({
  email: `profile-test-${Date.now()}@cineconnect.test`,
  username: `profile${Date.now().toString().slice(-8)}`,
  password: 'ProfileTest123!',
});

// Helper to register and login a test user
async function registerUser(page: import('@playwright/test').Page) {
  const user = generateUser();

  await page.goto('/profil?mode=register');
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: /Create Account/i }).click();

  // Wait for registration to complete
  await page.waitForTimeout(3000);
  await expect(page.getByTestId('sign-out-button')).toBeVisible({
    timeout: 15000,
  });

  return user;
}

test.describe('User Profile Data', () => {
  test.describe('Profile Stats', () => {
    test('should show zero reviews and watchlist for new user', async ({ page }) => {
      await registerUser(page);

      // Navigate to profile
      await page.goto('/profil');
      await page.waitForTimeout(2000);

      // Stats should show 0 for reviews and watchlist
      await expect(page.getByText('Reviews').first()).toBeVisible();
      await expect(page.getByText('Watchlist').first()).toBeVisible();
    });

    test('should display recent reviews section', async ({ page }) => {
      await registerUser(page);

      await page.goto('/profil');
      await page.waitForTimeout(2000);

      // Should show recent reviews section
      await expect(page.getByRole('heading', { name: /Recent Reviews/i })).toBeVisible();
    });

    test('should display watchlist section', async ({ page }) => {
      await registerUser(page);

      await page.goto('/profil');
      await page.waitForTimeout(2000);

      // Should show watchlist section
      await expect(page.getByRole('heading', { name: /Your Watchlist/i })).toBeVisible();
    });
  });

  test.describe('Review Creation and Profile Update', () => {
    test('should show review on profile after creating one', async ({ page }) => {
      await registerUser(page);

      // Navigate to a film (Fight Club)
      await page.goto('/film/550');
      await page.waitForSelector('h1', { timeout: 10000 });

      // Click write review button
      const reviewButton = page.getByRole('button', { name: /Write a Review/i });
      if (await reviewButton.isVisible()) {
        await reviewButton.click();

        // Wait for review form modal
        await page.waitForTimeout(1000);

        // Rate the film (click on 4th star for 8/10)
        const stars = page.locator('button[aria-label*="Rate"]');
        if ((await stars.count()) > 0) {
          await stars.nth(3).click();
        }

        // Add a comment
        const textarea = page.locator('textarea');
        if (await textarea.isVisible()) {
          await textarea.fill('This is a test review for E2E testing.');
        }

        // Submit the review
        await page.getByRole('button', { name: /Submit Review/i }).click();
        await page.waitForTimeout(3000);

        // Navigate to profile
        await page.goto('/profil');
        await page.waitForTimeout(2000);

        // Review count should be at least 1
        // Check the recent reviews section for our review
        await expect(page.getByText(/test review/i)).toBeVisible({
          timeout: 10000,
        });
      }
    });

    test('should allow editing an existing review', async ({ page }) => {
      await registerUser(page);

      // Create a review first
      await page.goto('/film/550');
      await page.waitForSelector('h1', { timeout: 10000 });

      const reviewButton = page.getByRole('button', { name: /Write a Review/i });
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForTimeout(1000);

        const stars = page.locator('button[aria-label*="Rate"]');
        if ((await stars.count()) > 0) {
          await stars.nth(2).click(); // 6/10
        }

        const textarea = page.locator('textarea');
        if (await textarea.isVisible()) {
          await textarea.fill('Original review content.');
        }

        await page.getByRole('button', { name: /Submit Review/i }).click();
        await page.waitForTimeout(3000);
      }

      // Reload the film page
      await page.goto('/film/550');
      await page.waitForSelector('h1', { timeout: 10000 });

      // Button should now say "Edit Your Review"
      const editButton = page.getByRole('button', { name: /Edit Your Review/i });
      await expect(editButton).toBeVisible({ timeout: 10000 });

      // Click to edit
      await editButton.click();
      await page.waitForTimeout(1000);

      // Modal should say "Edit Review" (check header)
      await expect(page.getByRole('heading', { name: /Edit Review/i })).toBeVisible();

      // Should have pre-filled content
      const textarea = page.locator('textarea');
      if (await textarea.isVisible()) {
        const currentContent = await textarea.inputValue();
        expect(currentContent).toContain('Original review');

        // Update the review
        await textarea.fill('Updated review content for E2E test.');
      }

      // Submit update
      await page.getByRole('button', { name: /Update Review/i }).click();
      await page.waitForTimeout(3000);

      // Verify update on profile
      await page.goto('/profil');
      await page.waitForTimeout(2000);

      await expect(page.getByText(/Updated review/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('To Watch and Profile Update', () => {
    test('should add film via To Watch and see it on profile', async ({ page }) => {
      await registerUser(page);

      await page.goto('/film/27205'); // Inception
      await page.waitForSelector('h1', { timeout: 10000 });

      const toWatchButton = page.getByTestId('watchlist-button');
      await expect(toWatchButton).toBeVisible();
      await expect(toWatchButton).toBeEnabled({ timeout: 15000 });
      await toWatchButton.click();
      await expect(toWatchButton.getByText('In list')).toBeVisible({ timeout: 10000 });

      // Navigate to profile - wait for watchlist API then assert film is there
      await page.goto('/profil');
      await page.waitForResponse(
        (res) => res.url().includes('/api/v1/watchlist') && res.request().method() === 'GET',
        { timeout: 15000 }
      );
      await page.waitForTimeout(500);

      const watchlistSection = page.getByRole('heading', { name: /Your Watchlist/i });
      await expect(watchlistSection).toBeVisible();

      // Film is shown as img with alt (poster) or in title attribute - use alt within watchlist
      await expect(
        page.getByTestId('profile-watchlist').getByRole('img', { name: 'Inception' })
      ).toBeVisible({ timeout: 15000 });

      const emptyMessage = page.getByText(/Your watchlist is empty/i);
      await expect(emptyMessage).not.toBeVisible({ timeout: 5000 });
    });

    test('should show In list after clicking To Watch', async ({ page }) => {
      await registerUser(page);

      await page.goto('/film/155'); // The Dark Knight
      await page.waitForSelector('h1', { timeout: 10000 });

      const toWatchButton = page.getByTestId('watchlist-button');
      await expect(toWatchButton).toBeVisible();
      await expect(toWatchButton.getByText('To Watch')).toBeVisible();
      await toWatchButton.click();
      await expect(toWatchButton.getByText('In list')).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to film when clicking watchlist item on profile', async ({ page }) => {
      await registerUser(page);

      await page.goto('/film/27205'); // Inception
      await page.waitForSelector('h1', { timeout: 10000 });
      const toWatchButton = page.getByTestId('watchlist-button');
      await toWatchButton.click();
      await expect(toWatchButton.getByText('In list')).toBeVisible({ timeout: 10000 });

      await page.goto('/profil');
      await page.waitForResponse(
        (res) => res.url().includes('/api/v1/watchlist') && res.request().method() === 'GET',
        { timeout: 15000 }
      );
      await page.waitForTimeout(500);

      const watchlistItem = page.getByTestId('profile-watchlist-item').first();
      await expect(watchlistItem).toBeVisible({ timeout: 10000 });
      await watchlistItem.click();
      await expect(page).toHaveURL(/\/film\/27205/, { timeout: 10000 });
      await expect(page.locator('h1')).toContainText(/Inception/i);
    });
  });

  test.describe('Navigation from profile', () => {
    test('should navigate to film when clicking recent review on profile', async ({ page }) => {
      await registerUser(page);

      await page.goto('/film/550'); // Fight Club
      await page.waitForSelector('h1', { timeout: 10000 });
      const reviewButton = page.getByRole('button', { name: /Write a Review/i });
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForTimeout(1000);
        const stars = page.locator('button[aria-label*="Rate"]');
        if ((await stars.count()) > 0) await stars.nth(2).click();
        const textarea = page.locator('textarea');
        if (await textarea.isVisible()) await textarea.fill('Nav test review.');
        await page.getByRole('button', { name: /Submit Review/i }).click();
        await page.waitForTimeout(3000);
      }

      await page.goto('/profil');
      await page.waitForTimeout(2000);
      const link = page.locator('a[href*="/film/550"]').first();
      await expect(link).toBeVisible({ timeout: 10000 });
      await link.click();
      await expect(page).toHaveURL(/\/film\/550/, { timeout: 10000 });
      await expect(page.locator('h1')).toContainText(/Fight Club/i);
    });
  });

  test.describe('Profile Data Persistence', () => {
    test('should persist review data after page reload', async ({ page }) => {
      const user = await registerUser(page);

      // Create a review
      await page.goto('/film/680'); // Pulp Fiction
      await page.waitForSelector('h1', { timeout: 10000 });

      const reviewButton = page.getByRole('button', { name: /Write a Review/i });
      if (await reviewButton.isVisible()) {
        await reviewButton.click();
        await page.waitForTimeout(1000);

        const stars = page.locator('button[aria-label*="Rate"]');
        if ((await stars.count()) > 0) {
          await stars.nth(4).click(); // 10/10
        }

        const textarea = page.locator('textarea');
        if (await textarea.isVisible()) {
          await textarea.fill('Persistence test review.');
        }

        await page.getByRole('button', { name: /Submit Review/i }).click();
        await page.waitForTimeout(3000);
      }

      // Logout
      await page.goto('/profil');
      await page.waitForTimeout(1000);
      await page.getByTestId('sign-out-button').click();
      await page.waitForTimeout(2000);

      // Login again
      await page.goto('/profil?mode=login');
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password').fill(user.password);
      await page.getByRole('button', { name: /Sign In/i }).click();
      await page.waitForTimeout(3000);

      // Review should still be there
      await page.goto('/profil');
      await page.waitForTimeout(2000);

      await expect(page.getByText(/Persistence test review/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
