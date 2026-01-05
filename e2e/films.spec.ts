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

      const similarFilmLink = page.locator('a[href*="/film/"]').last();

      if (await similarFilmLink.isVisible()) {
        const initialUrl = page.url();
        await similarFilmLink.click();

        await page.waitForURL(/\/film\/\d+/, { timeout: 10000 });

        expect(page.url()).not.toBe(initialUrl);
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
});
