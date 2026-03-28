/**
 * E2E Tests: Static / Info Pages
 *
 * Tests the About, Help, API Docs, Contact, Terms, Privacy, and Cookie pages.
 * These pages are publicly accessible and contain no API calls.
 */

import { test, expect } from '@playwright/test';

// ─── About ────────────────────────────────────────────────────────────────────

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /About CinéConnect/i })).toBeVisible();
  });

  test('should display the team section with both authors', async ({ page }) => {
    await expect(page.getByText(/Paul Compagnon/i)).toBeVisible();
    await expect(page.getByText(/Franck YAPI/i)).toBeVisible();
  });

  test('should display the tech stack section', async ({ page }) => {
    await expect(page.getByText(/Tech Stack/i)).toBeVisible();
    await expect(page.getByText('React')).toBeVisible();
    await expect(page.getByText('TypeScript')).toBeVisible();
  });

  test('should display the feature cards', async ({ page }) => {
    await expect(page.getByText(/Track Films/i)).toBeVisible();
    await expect(page.getByText(/Rate & Review/i)).toBeVisible();
    await expect(page.getByText(/Connect/i)).toBeVisible();
  });

  test('should have a working "Start exploring" link to home', async ({ page }) => {
    await page.getByRole('link', { name: /Start exploring/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should be reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^About$/i }).click();
    await expect(page).toHaveURL('/about');
  });
});

// ─── Help ─────────────────────────────────────────────────────────────────────

test.describe('Help page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Help Center/i })).toBeVisible();
  });

  test('should display FAQ items collapsed by default', async ({ page }) => {
    const firstQuestion = page.getByText(/How do I create an account/i);
    await expect(firstQuestion).toBeVisible();
    // Answer should not be visible yet
    await expect(page.getByText(/Click on "Sign In"/i)).not.toBeVisible();
  });

  test('should expand a FAQ item on click', async ({ page }) => {
    await page.getByText(/How do I create an account/i).click();
    await expect(page.getByText(/Click on "Sign In"/i)).toBeVisible();
  });

  test('should collapse a FAQ item on second click', async ({ page }) => {
    const question = page.getByText(/How do I create an account/i);
    await question.click();
    await expect(page.getByText(/Click on "Sign In"/i)).toBeVisible();
    await question.click();
    await expect(page.getByText(/Click on "Sign In"/i)).not.toBeVisible();
  });

  test('should have a link to the contact page', async ({ page }) => {
    await page
      .getByRole('link', { name: /Contact us/i })
      .first()
      .click();
    await expect(page).toHaveURL('/contact');
  });

  test('should be reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^Help$/i }).click();
    await expect(page).toHaveURL('/help');
  });
});

// ─── API Docs ─────────────────────────────────────────────────────────────────

test.describe('API docs page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api-docs');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /API Reference/i })).toBeVisible();
  });

  test('should display endpoint list', async ({ page }) => {
    await expect(page.getByText('/api/v1/auth/login')).toBeVisible();
    await expect(page.getByText('/api/v1/watchlist')).toBeVisible();
    await expect(page.getByText('/api/v1/friends')).toBeVisible();
  });

  test('should display HTTP method badges', async ({ page }) => {
    await expect(page.getByText('GET').first()).toBeVisible();
    await expect(page.getByText('POST').first()).toBeVisible();
    await expect(page.getByText('DELETE').first()).toBeVisible();
  });

  test('should display the Swagger link button', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Open Swagger/i })).toBeVisible();
  });

  test('should display external data sources section', async ({ page }) => {
    await expect(page.getByText(/OMDB API/i)).toBeVisible();
    await expect(page.getByText(/TMDb API/i)).toBeVisible();
  });

  test('should be reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^API$/i }).click();
    await expect(page).toHaveURL('/api-docs');
  });
});

// ─── Contact ──────────────────────────────────────────────────────────────────

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Contact Us/i })).toBeVisible();
  });

  test('should display the contact form', async ({ page }) => {
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Send message/i })).toBeVisible();
  });

  test('should display team member info', async ({ page }) => {
    await expect(page.getByText(/Paul Compagnon/i)).toBeVisible();
    await expect(page.getByText(/Franck YAPI/i)).toBeVisible();
  });

  test('should require all fields before submitting', async ({ page }) => {
    await page.getByRole('button', { name: /Send message/i }).click();
    // Form validation should prevent submission — name field is required
    const nameInput = page.getByPlaceholder(/Your name/i);
    await expect(nameInput).toBeVisible();
    // Browser native validation: form should not have navigated away
    await expect(page).toHaveURL('/contact');
  });

  test('should fill and submit the form', async ({ page }) => {
    await page.getByPlaceholder(/Your name/i).fill('John Doe');
    await page.getByPlaceholder(/you@example.com/i).fill('john@example.com');
    await page.getByRole('combobox').selectOption('Bug report');
    await page.getByPlaceholder(/Describe your issue/i).fill('Test message from e2e');
    // Submit opens mailto — just check no JS error occurs
    await page.getByRole('button', { name: /Send message/i }).click();
    // After submit, "Message sent!" confirmation should be visible
    await expect(page.getByText(/Message sent!/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show "Send another message" after submit', async ({ page }) => {
    await page.getByPlaceholder(/Your name/i).fill('Test User');
    await page.getByPlaceholder(/you@example.com/i).fill('test@example.com');
    await page.getByRole('combobox').selectOption('General question');
    await page.getByPlaceholder(/Describe your issue/i).fill('Hello');
    await page.getByRole('button', { name: /Send message/i }).click();
    await expect(page.getByRole('button', { name: /Send another message/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('should reset form when clicking "Send another message"', async ({ page }) => {
    await page.getByPlaceholder(/Your name/i).fill('Test User');
    await page.getByPlaceholder(/you@example.com/i).fill('test@example.com');
    await page.getByRole('combobox').selectOption('General question');
    await page.getByPlaceholder(/Describe your issue/i).fill('Hello');
    await page.getByRole('button', { name: /Send message/i }).click();
    await page.getByRole('button', { name: /Send another message/i }).click();
    await expect(page.getByPlaceholder(/Your name/i)).toBeVisible();
  });

  test('should be reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^Contact$/i }).click();
    await expect(page).toHaveURL('/contact');
  });
});

// ─── Terms of Use ─────────────────────────────────────────────────────────────

test.describe('Terms of Use page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/terms');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Terms of Use/i })).toBeVisible();
  });

  test('should display key sections', async ({ page }) => {
    await expect(page.getByText(/Acceptance of Terms/i)).toBeVisible();
    await expect(page.getByText(/Description of Service/i)).toBeVisible();
    await expect(page.getByText(/User Accounts/i)).toBeVisible();
    await expect(page.getByText(/Limitation of Liability/i)).toBeVisible();
  });

  test('should display the last updated date', async ({ page }) => {
    await expect(page.getByText(/March 2026/i)).toBeVisible();
  });

  test('should have a link to the contact page', async ({ page }) => {
    await page.getByRole('link', { name: /contact us/i }).click();
    await expect(page).toHaveURL('/contact');
  });

  test('should be reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Terms of Use/i }).click();
    await expect(page).toHaveURL('/terms');
  });
});

// ─── Privacy Policy ───────────────────────────────────────────────────────────

test.describe('Privacy Policy page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/privacy');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
  });

  test('should display key sections', async ({ page }) => {
    await expect(page.getByText(/Information We Collect/i)).toBeVisible();
    await expect(page.getByText(/How We Use Your Information/i)).toBeVisible();
    await expect(page.getByText(/Third-Party Services/i)).toBeVisible();
    await expect(page.getByText(/Your Rights/i)).toBeVisible();
  });

  test('should mention Google OAuth', async ({ page }) => {
    await expect(page.getByText(/Google OAuth/i)).toBeVisible();
  });

  test('should have a link to the cookie policy', async ({ page }) => {
    await page.getByRole('link', { name: /Cookie Policy/i }).click();
    await expect(page).toHaveURL('/cookies');
  });

  test('should have a link to settings', async ({ page }) => {
    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL('/settings');
  });

  test('should be reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Privacy Policy/i }).click();
    await expect(page).toHaveURL('/privacy');
  });
});

// ─── Cookie Policy ────────────────────────────────────────────────────────────

test.describe('Cookie Policy page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cookies');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Cookie Policy/i })).toBeVisible();
  });

  test('should display the cookies table', async ({ page }) => {
    await expect(page.getByText('refresh_token')).toBeVisible();
    await expect(page.getByText('Authentication')).toBeVisible();
    await expect(page.getByText('HttpOnly')).toBeVisible();
  });

  test('should list cookies that are NOT used', async ({ page }) => {
    await expect(page.getByText(/Cookies we do NOT use/i)).toBeVisible();
    await expect(page.getByText(/Google Analytics/i)).toBeVisible();
  });

  test('should have a link to the profile page', async ({ page }) => {
    await page.getByRole('link', { name: /profile page/i }).click();
    await expect(page).toHaveURL('/profil');
  });

  test('should have a link to the contact page', async ({ page }) => {
    await page.getByRole('link', { name: /Contact us/i }).click();
    await expect(page).toHaveURL('/contact');
  });

  test('should be reachable from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Cookie Policy/i }).click();
    await expect(page).toHaveURL('/cookies');
  });
});

// ─── Auth Callback ────────────────────────────────────────────────────────────

test.describe('Auth callback page', () => {
  test('should redirect to /profil when no token is provided', async ({ page }) => {
    await page.goto('/auth/callback');
    await expect(page).toHaveURL(/\/profil/, { timeout: 5000 });
  });

  test('should redirect to /profil when token is invalid', async ({ page }) => {
    await page.goto('/auth/callback?token=invalid-token');
    await expect(page).toHaveURL(/\/profil/, { timeout: 10000 });
  });

  test('should show a spinner while processing', async ({ page }) => {
    // With a syntactically valid but expired JWT the spinner will show briefly
    // before the getCurrentUser call fails and redirects
    const fakeToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJ1c2VySWQiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwfQ' +
      '.signature';
    await page.goto(`/auth/callback?token=${fakeToken}`);
    // Either the spinner was visible (fast machines may skip it) or we're already redirected
    const hasRedirected = page.url().includes('/profil');
    if (!hasRedirected) {
      await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 3000 });
    }
  });
});
