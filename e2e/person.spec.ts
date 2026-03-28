/**
 * E2E Tests: Person / Actor detail page
 *
 * Tests biography display, filmography, and the "Show more" pagination
 * for actors with large filmographies.
 * Uses TMDb person IDs that are stable and well-known.
 *   287  → Brad Pitt
 *   6384 → Keanu Reeves
 *   31   → Tom Hanks
 */

import { test, expect } from '@playwright/test';

test.describe('Person detail page', () => {
  test.describe('Page structure', () => {
    test('should display person name as heading', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.locator('h1')).toContainText(/Brad Pitt/i);
    });

    test('should display profile photo', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      const img = page.locator('img').first();
      await expect(img).toBeVisible();
    });

    test('should display "Known for" department', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.getByText(/Known for/i)).toBeVisible();
    });

    test('should display birth year', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      // Brad Pitt born 1963
      await expect(page.getByText(/1963/)).toBeVisible({ timeout: 10000 });
    });

    test('should display biography', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.getByText(/Biography/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Filmography — As Actor section', () => {
    test('should display the "As Actor" section', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.getByRole('heading', { name: /As Actor/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('should display film posters', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      // Wait for film grid to load
      await page.waitForSelector('a[href*="/film/"]', { timeout: 15000 });
      const filmLinks = page.locator('a[href*="/film/"]');
      await expect(filmLinks.first()).toBeVisible();
    });

    test('should show at most 24 films initially', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.waitForSelector('a[href*="/film/"]', { timeout: 15000 });
      const filmLinks = page.locator('a[href*="/film/"]');
      const count = await filmLinks.count();
      expect(count).toBeLessThanOrEqual(24);
    });

    test('should display film count in section header', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      // Header shows "As Actor (N)"
      await expect(page.getByText(/As Actor/i)).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/\\(\\d+\\)/')).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to film page when clicking a poster', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.waitForSelector('a[href*="/film/"]', { timeout: 15000 });
      const firstFilm = page.locator('a[href*="/film/"]').first();
      await firstFilm.click();
      await expect(page).toHaveURL(/\/film\/\d+/, { timeout: 10000 });
      await page.waitForSelector('h1', { timeout: 10000 });
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Show more — pagination', () => {
    // Brad Pitt has well over 24 acting credits, so the "Show more" button should appear
    test('should display "Show more" button when actor has more than 24 films', async ({
      page,
    }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.waitForSelector('a[href*="/film/"]', { timeout: 15000 });

      const showMoreBtn = page.getByRole('button', { name: /Show more/i });
      await expect(showMoreBtn).toBeVisible({ timeout: 10000 });
    });

    test('should display "Showing X of Y films" counter', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.waitForSelector('a[href*="/film/"]', { timeout: 15000 });

      await expect(page.getByText(/Showing \d+ of \d+ films/i)).toBeVisible({ timeout: 10000 });
    });

    test('should load more films after clicking "Show more"', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.waitForSelector('a[href*="/film/"]', { timeout: 15000 });

      const beforeCount = await page.locator('a[href*="/film/"]').count();

      const showMoreBtn = page.getByRole('button', { name: /Show more/i });
      await expect(showMoreBtn).toBeVisible({ timeout: 10000 });
      await showMoreBtn.click();

      await page.waitForTimeout(300);
      const afterCount = await page.locator('a[href*="/film/"]').count();
      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    test('should update the counter after clicking "Show more"', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.waitForSelector('a[href*="/film/"]', { timeout: 15000 });

      const showMoreBtn = page.getByRole('button', { name: /Show more/i });
      await expect(showMoreBtn).toBeVisible({ timeout: 10000 });

      const counterBefore = await page.getByText(/Showing \d+ of \d+ films/i).textContent();
      await showMoreBtn.click();
      await page.waitForTimeout(300);
      const counterAfter = await page.getByText(/Showing \d+ of \d+ films/i).textContent();

      expect(counterAfter).not.toBe(counterBefore);
    });

    test('should hide "Show more" button when all films are visible', async ({ page }) => {
      // Use Keanu Reeves — fewer credits, easier to exhaust
      await page.goto('/person/6384');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.waitForSelector('a[href*="/film/"]', { timeout: 15000 });

      const showMoreBtn = page.getByRole('button', { name: /Show more/i });

      // Click until button disappears
      let attempts = 0;
      while ((await showMoreBtn.isVisible()) && attempts < 10) {
        await showMoreBtn.click();
        await page.waitForTimeout(300);
        attempts++;
      }

      await expect(showMoreBtn).not.toBeVisible();
    });
  });

  test.describe('Behind the Camera section', () => {
    test('should display crew section for director', async ({ page }) => {
      // Clint Eastwood (2888) — known director
      await page.goto('/person/2888');
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.getByRole('heading', { name: /Behind the Camera/i })).toBeVisible({
        timeout: 15000,
      });
    });
  });

  test.describe('Navigation', () => {
    test('should have a back button', async ({ page }) => {
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await expect(page.getByRole('link', { name: /Back/i })).toBeVisible();
    });

    test('should navigate back when clicking Back', async ({ page }) => {
      await page.goto('/films');
      await page.goto('/person/287');
      await page.waitForSelector('h1', { timeout: 15000 });
      await page.getByRole('link', { name: /Back/i }).click();
      await expect(page).toHaveURL('/films');
    });
  });

  test.describe('Error state', () => {
    test('should show not found message for invalid person id', async ({ page }) => {
      await page.goto('/person/999999999');
      await expect(page.getByText(/Person Not Found/i)).toBeVisible({ timeout: 15000 });
    });

    test('should have a link back to films on not found page', async ({ page }) => {
      await page.goto('/person/999999999');
      await expect(page.getByRole('link', { name: /Back to Films/i })).toBeVisible({
        timeout: 15000,
      });
    });
  });
});
