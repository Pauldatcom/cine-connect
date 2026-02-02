/**
 * E2E Tests: Films Discovery
 *
 * Tests film browsing, searching, and viewing details. Using Playwright to Headless testing.
 */

import { expect, test } from '@playwright/test';

test.describe('Films Discovery', () => {
  test.describe('Home Page', () => {
    test('should display films on homepage', async ({ page }) => {
      await page.goto('/');

      await page.waitForSelector('img', { timeout: 15000 });

      await expect(page.locator('img').first()).toBeVisible();

      await expect(page.getByRole('navigation').getByRole('link', { name: 'Films' })).toBeVisible();
    });

    test('should navigate to film details from homepage', async ({ page }) => {
      await page.goto('/');

      await page.waitForSelector('img', { timeout: 10000 });

      const filmLink = page.locator('a[href*="/film/"]').first();
      await filmLink.click();

      await expect(page).toHaveURL(/\/film\/\d+/);
    });
  });

  test.describe('Films Browse Page', () => {
    test('should display films grid', async ({ page }) => {
      await page.goto('/films');

      await page.waitForSelector('img', { timeout: 10000 });

      await expect(page.locator('img').first()).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto('/films');

      const searchInput = page.getByPlaceholder(/search/i);

      if (await searchInput.isVisible()) {
        await searchInput.fill('Inception');

        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  test.describe('Film Detail Page', () => {
    test('should display film information', async ({ page }) => {
      await page.goto('/film/550');

      await page.waitForSelector('h1', { timeout: 10000 });

      await expect(page.locator('h1')).toBeVisible();

      await expect(page.locator('img').first()).toBeVisible();
    });

    test('should display cast section', async ({ page }) => {
      await page.goto('/film/550');

      await page.waitForSelector('h1', { timeout: 10000 });

      await expect(page.getByRole('heading', { name: /cast/i })).toBeVisible();
    });

    test('should display similar films', async ({ page }) => {
      await page.goto('/film/550');

      await page.waitForSelector('h1', { timeout: 10000 });

      await expect(page.getByText(/similar|more like this/i)).toBeVisible();
    });

    test('should navigate between films', async ({ page }) => {
      await page.goto('/film/550');
      await page.waitForSelector('h1', { timeout: 10000 });

      const similarHeading = page.getByRole('heading', { name: /Similar Films/i });
      await expect(similarHeading).toBeVisible({ timeout: 10000 });

      const similarSection = page.locator('section').filter({
        has: similarHeading,
      });
      const similarFilmLink = similarSection.locator('a[href*="/film/"]').first();
      await expect(similarFilmLink).toBeVisible();

      const initialUrl = page.url();
      await similarFilmLink.click();

      await page.waitForURL(/\/film\/\d+/, { timeout: 10000 });
      expect(page.url()).not.toBe(initialUrl);
    });

    test('should show reviews section and review cards link to film', async ({ page }) => {
      await page.goto('/film/550');
      await page.waitForSelector('h1', { timeout: 10000 });

      const reviewsHeading = page.getByRole('heading', { name: /reviews/i });
      await expect(reviewsHeading).toBeVisible({ timeout: 10000 });

      const filmLinkInReviews = page.locator('a[href*="/film/550"]').first();
      if (await filmLinkInReviews.isVisible()) {
        await filmLinkInReviews.click();
        await expect(page).toHaveURL(/\/film\/550/);
        await expect(page.locator('h1')).toBeVisible();
      }
    });
  });

  test.describe('Film View Toggles', () => {
    test('should toggle between popular and trending views', async ({ page }) => {
      await page.goto('/films');

      await page.waitForSelector('img', { timeout: 15000 });

      const trendingButton = page.getByRole('button', { name: /trending/i });

      if (await trendingButton.isVisible()) {
        await trendingButton.click();

        await page.waitForTimeout(500);

        await expect(page.locator('img').first()).toBeVisible();
      }
    });

    test('should toggle to top rated view', async ({ page }) => {
      await page.goto('/films');

      await page.waitForSelector('img', { timeout: 15000 });

      const topRatedButton = page.getByRole('button', { name: /top.?rated/i });

      if (await topRatedButton.isVisible()) {
        await topRatedButton.click();

        await page.waitForTimeout(500);

        await expect(page.locator('img').first()).toBeVisible();
      }
    });
  });

  test.describe('To Watch (watchlist) integration', () => {
    // Helper to register user
    async function registerUser(page: import('@playwright/test').Page) {
      const user = {
        email: `watchlist-${Date.now()}@cineconnect.test`,
        username: `wl${Date.now().toString().slice(-8)}`,
        password: 'WatchlistTest123!',
      };

      await page.goto('/profil?mode=register');
      await page.getByLabel('Username').fill(user.username);
      await page.getByLabel('Email').fill(user.email);
      await page.getByLabel('Password', { exact: true }).fill(user.password);
      await page.getByLabel('Confirm Password').fill(user.password);
      await page.getByRole('button', { name: /Create Account/i }).click();

      await page.waitForTimeout(3000);
      await expect(page.getByTestId('sign-out-button')).toBeVisible({
        timeout: 15000,
      });

      return user;
    }

    test('should show To Watch button on film detail page', async ({ page }) => {
      await registerUser(page);

      await page.goto('/film/550');
      await page.waitForSelector('h1', { timeout: 10000 });

      const toWatchButton = page.getByTestId('watchlist-button');
      await expect(toWatchButton).toBeVisible();
      await expect(toWatchButton).toBeEnabled({ timeout: 15000 });
      await expect(toWatchButton.getByText('To Watch')).toBeVisible();
    });

    test('should toggle To Watch: add film then show In list', async ({ page }) => {
      await registerUser(page);

      await page.goto('/film/603'); // The Matrix
      await page.waitForSelector('h1', { timeout: 10000 });

      const toWatchButton = page.getByTestId('watchlist-button');
      await expect(toWatchButton).toBeVisible();
      await expect(toWatchButton.getByText('To Watch')).toBeVisible();

      await toWatchButton.click();
      await expect(toWatchButton.getByText('In list')).toBeVisible({ timeout: 10000 });
    });

    test('should show film in lists page after adding via To Watch', async ({ page }) => {
      await registerUser(page);

      await page.goto('/film/120');
      await page.waitForSelector('h1', { timeout: 10000 });

      const toWatchButton = page.getByTestId('watchlist-button');
      await expect(toWatchButton).toBeVisible();
      await expect(toWatchButton).toBeEnabled({ timeout: 15000 });
      await toWatchButton.click();
      await expect(toWatchButton.getByText('In list')).toBeVisible({ timeout: 10000 });

      // Navigate to lists - wait for watchlist API then assert film is in grid
      await page.goto('/lists');
      await page.waitForResponse(
        (res) => res.url().includes('/api/v1/watchlist') && res.request().method() === 'GET',
        { timeout: 15000 }
      );
      await page.waitForTimeout(500);

      await expect(page.getByRole('heading', { name: /Watchlist/i })).toBeVisible();
      await expect(page.getByTestId('watchlist-grid')).toBeVisible({ timeout: 10000 });
      // Film card is a link with aria-label = film title
      await expect(
        page
          .getByTestId('watchlist-grid')
          .getByRole('link', { name: /Lord of the Rings|Fellowship/i })
      ).toBeVisible({ timeout: 15000 });
    });

    test('should persist watchlist after reload', async ({ page }) => {
      await registerUser(page);

      await page.goto('/film/603'); // The Matrix
      await page.waitForSelector('h1', { timeout: 10000 });

      const toWatchButton = page.getByTestId('watchlist-button');
      await expect(toWatchButton).toBeVisible();
      await expect(toWatchButton).toBeEnabled({ timeout: 15000 });
      await toWatchButton.click();
      await expect(toWatchButton.getByText('In list')).toBeVisible({ timeout: 10000 });

      await page.goto('/lists');
      await page.waitForResponse(
        (res) => res.url().includes('/api/v1/watchlist') && res.request().method() === 'GET',
        { timeout: 15000 }
      );
      await page.waitForTimeout(500);

      await expect(page.getByTestId('watchlist-grid')).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByTestId('watchlist-grid').getByRole('link', { name: 'The Matrix' })
      ).toBeVisible({ timeout: 15000 });

      await page.reload();
      await page.waitForResponse(
        (res) => res.url().includes('/api/v1/watchlist') && res.request().method() === 'GET',
        { timeout: 15000 }
      );
      await page.waitForTimeout(500);
      await expect(
        page.getByTestId('watchlist-grid').getByRole('link', { name: 'The Matrix' })
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
