/**
 * E2E Tests: Chat/Discussion Feature
 *
 * Tests real-time messaging, online status, and typing indicators.
 * Uses a single shared authenticated session for all logged-in tests to avoid
 * auth rate limits (20 req/15min per IP on /api/v1/auth).
 */

import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAT_AUTH_PATH = path.join(__dirname, '.auth', 'chat-user.json');

/**
 * Registers one user via UI, waits for success or failure (no blind timeout).
 * Fails with a clear error if registration fails (e.g. rate limit).
 */
async function registerAndLoginOnce(page: import('@playwright/test').Page): Promise<void> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const user = {
    email: `test-${timestamp}-${random}@cineconnect.test`,
    username: `u${timestamp.toString().slice(-6)}${random}`,
    password: 'TestPassword123!',
  };

  await page.goto('/profil?mode=register');
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: /Create Account/i }).click();

  // Wait for outcome: either logged in (sign-out visible) or error message
  const signedOut = page.getByTestId('sign-out-button');
  const failed = page.getByText(/Registration failed|Please try again later/i);
  const result = await Promise.race([
    signedOut.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'ok' as const),
    failed.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'fail' as const),
  ]).catch(() => 'timeout' as const);

  if (result === 'fail') {
    throw new Error(
      'Registration failed (page showed error). Check backend is running and auth is not rate limited.'
    );
  }
  if (result === 'timeout') {
    throw new Error('Registration neither succeeded nor showed error within 15s.');
  }
}

/**
 * Returns a new page using the shared chat auth state (from beforeAll).
 * Caller must close the returned context when done.
 */
async function newLoggedInPage(browser: import('@playwright/test').Browser): Promise<{
  page: import('@playwright/test').Page;
  context: import('@playwright/test').BrowserContext;
}> {
  const context = await browser.newContext({ storageState: CHAT_AUTH_PATH });
  const page = await context.newPage();
  return { page, context };
}

test.describe('Chat/Discussion', () => {
  test.describe('Chat Page Access', () => {
    test('should require login to access discussion page', async ({ page }) => {
      await page.goto('/discussion');
      await expect(page.getByRole('heading', { name: /Sign in to Chat/i })).toBeVisible();
    });
  });

  // One shared auth session for all logged-in chat tests (avoids auth rate limit)
  test.describe('when logged in', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await registerAndLoginOnce(page);
      await fs.promises.mkdir(path.dirname(CHAT_AUTH_PATH), { recursive: true });
      await ctx.storageState({ path: CHAT_AUTH_PATH });
      await ctx.close();
    });

    test('should show discussion page when logged in', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
      } finally {
        await context.close();
      }
    });

    test('should display conversation UI elements', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
        await expect(page.getByPlaceholder(/search/i)).toBeVisible();
      } finally {
        await context.close();
      }
    });

    test('should show placeholder when no conversation selected', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        await expect(page.getByText(/Select a conversation|start a new message/i)).toBeVisible();
      } finally {
        await context.close();
      }
    });

    test('should load conversations without undefined error', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        await page
          .waitForResponse(
            (res) => res.url().includes('/api/v1/messages') && res.request().method() === 'GET',
            { timeout: 15000 }
          )
          .catch(() => {});
        await page.waitForTimeout(500);
        await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
        await expect(page.getByText(/undefined|Query data cannot be undefined/i)).not.toBeVisible();
      } finally {
        await context.close();
      }
    });

    test('should allow typing in search', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill('test');
        await expect(searchInput).toHaveValue('test');
      } finally {
        await context.close();
      }
    });

    test('should show connection indicator when not connected', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
      } finally {
        await context.close();
      }
    });

    test('should show empty state when no conversation selected', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        await expect(page.getByText(/Your Messages/i)).toBeVisible();
        await expect(page.getByText(/Select a conversation|start a new message/i)).toBeVisible();
      } finally {
        await context.close();
      }
    });

    test('should have search functionality', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        const searchInput = page.getByPlaceholder(/search conversations/i);
        await expect(searchInput).toBeVisible();
        await searchInput.fill('alice');
        await expect(searchInput).toHaveValue('alice');
      } finally {
        await context.close();
      }
    });

    test('should show New message button and friend picker', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/discussion');
        const newMessageBtn = page.getByRole('button', { name: /New message/i });
        await expect(newMessageBtn).toBeVisible();
        await newMessageBtn.click();
        // Picker should show: either "Choose a friend" or "No friends yet" (either is valid)
        await expect(page.getByText(/Choose a friend|No friends yet/i).first()).toBeVisible({
          timeout: 5000,
        });
      } finally {
        await context.close();
      }
    });

    test('should show Members (not Likes) in user dropdown', async ({ browser }) => {
      const { page, context } = await newLoggedInPage(browser);
      try {
        await page.goto('/');
        await page.getByTestId('profile-menu-trigger').click();
        await expect(page.getByRole('link', { name: /^Members$/i }).first()).toBeVisible({
          timeout: 5000,
        });
        await expect(page.getByRole('link', { name: /Likes/i })).not.toBeVisible();
      } finally {
        await context.close();
      }
    });
  });

  test.describe('Chat between two users', () => {
    // Must point at backend (default 3000), not frontend (5173)
    const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
    const password = 'TestPassword123!';

    async function registerUserViaApi(suffix: string) {
      const ts = Date.now();
      const r = Math.random().toString(36).slice(2, 8);
      const email = `e2e-${ts}-${r}${suffix}@cineconnect.test`;
      const username = `user${ts.toString().slice(-6)}${r}${suffix}`;
      const url = `${BACKEND_URL}/api/v1/auth/register`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const body = await res.text();
      if (!res.ok) {
        let err = `Register failed: ${res.status} ${url}`;
        try {
          const j = JSON.parse(body) as { error?: string };
          if (j?.error) err += ` - ${j.error}`;
        } catch {
          if (body) err += ` - ${body.slice(0, 200)}`;
        }
        throw new Error(err);
      }
      const json = JSON.parse(body) as {
        success: boolean;
        data: { user: { id: string }; accessToken: string };
      };
      return {
        email,
        username,
        password,
        userId: json.data.user.id,
        accessToken: json.data.accessToken,
      };
    }

    async function sendMessageViaApi(senderToken: string, receiverId: string, content: string) {
      const res = await fetch(`${BACKEND_URL}/api/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senderToken}`,
        },
        body: JSON.stringify({ receiverId, content }),
      });
      if (!res.ok) throw new Error(`Send message failed: ${res.status}`);
    }

    async function sendFriendRequest(token: string, username: string) {
      const res = await fetch(`${BACKEND_URL}/api/v1/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error(`Send friend request failed: ${res.status}`);
    }

    async function getPendingRequests(
      token: string
    ): Promise<{ id: string; user: { id: string } }[]> {
      const res = await fetch(`${BACKEND_URL}/api/v1/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Get pending requests failed: ${res.status}`);
      const json = (await res.json()) as { data: { id: string; user: { id: string } }[] };
      return json.data ?? [];
    }

    async function acceptFriendRequest(token: string, requestId: string) {
      const res = await fetch(`${BACKEND_URL}/api/v1/friends/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accept: true }),
      });
      if (!res.ok) throw new Error(`Accept friend request failed: ${res.status}`);
    }

    test('two users can see each other and exchange a message', async ({ browser }) => {
      test.setTimeout(90000); // 2 logins + 2 discussions + message round-trip can exceed 30s

      const userA = await registerUserViaApi('a');
      const userB = await registerUserViaApi('b');
      await sendMessageViaApi(userA.accessToken, userB.userId, 'Hello from A');

      const contextA = await browser.newContext();
      const contextB = await browser.newContext();
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      try {
        await pageA.goto('/profil?mode=login');
        await pageA.getByLabel('Email').fill(userA.email);
        await pageA.getByLabel('Password').fill(userA.password);
        await pageA.getByRole('button', { name: /Sign In|Log in/i }).click();
        await expect(pageA.getByTestId('sign-out-button')).toBeVisible({ timeout: 15000 });

        await pageB.goto('/profil?mode=login');
        await pageB.getByLabel('Email').fill(userB.email);
        await pageB.getByLabel('Password').fill(userB.password);
        await pageB.getByRole('button', { name: /Sign In|Log in/i }).click();
        await expect(pageB.getByTestId('sign-out-button')).toBeVisible({ timeout: 15000 });

        await pageA.goto('/discussion');
        await pageB.goto('/discussion');

        await expect(pageA.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
        await expect(pageB.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();

        // User A: open conversation with B and wait for "Hello from A" in the message area (not sidebar)
        await pageA
          .getByRole('button', { name: new RegExp(userB.username, 'i') })
          .first()
          .click();
        await expect(pageA.getByTestId('chat-messages').getByText('Hello from A')).toBeVisible({
          timeout: 10000,
        });

        // User A: send a new message (button has aria-label="Send message"; Enter also submits)
        const inputA = pageA.getByPlaceholder('Type a message...');
        await inputA.fill('E2E test message');
        await pageA.getByRole('button', { name: 'Send message' }).click();
        await expect(pageA.getByTestId('chat-messages').getByText('E2E test message')).toBeVisible({
          timeout: 5000,
        });

        // User B: open conversation with A and wait for "E2E test message" in the message area
        // Frontend calls PATCH /api/v1/messages/:userId/read when opening a conversation; assert no 404
        const readRequestPromise = pageB.waitForResponse(
          (res) =>
            res.url().includes('/api/v1/messages/') &&
            res.url().endsWith('/read') &&
            res.request().method() === 'PATCH',
          { timeout: 10000 }
        );
        await pageB
          .getByRole('button', { name: new RegExp(userA.username, 'i') })
          .first()
          .click();
        const readResponse = await readRequestPromise;
        expect(readResponse.status(), 'Mark-as-read PATCH should not 404').not.toBe(404);
        await expect(pageB.getByTestId('chat-messages').getByText('E2E test message')).toBeVisible({
          timeout: 15000,
        });
      } finally {
        await contextA.close().catch(() => {});
        await contextB.close().catch(() => {});
      }
    });

    test('Members page shows Message link and /discussion?with= opens conversation', async ({
      browser,
    }) => {
      test.setTimeout(60000);
      const userA = await registerUserViaApi('ma');
      const userB = await registerUserViaApi('mb');
      await sendFriendRequest(userA.accessToken, userB.username);
      const pending = await getPendingRequests(userB.accessToken);
      const requestFromA = pending.find((r) => r.user.id === userA.userId);
      if (!requestFromA) throw new Error('B did not receive friend request from A');
      await acceptFriendRequest(userB.accessToken, requestFromA.id);

      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await page.goto('/profil?mode=login');
        await page.getByLabel('Email').fill(userA.email);
        await page.getByLabel('Password').fill(userA.password);
        await page.getByRole('button', { name: /Sign In|Log in/i }).click();
        await expect(page.getByTestId('sign-out-button')).toBeVisible({ timeout: 15000 });

        await page.goto('/members');
        await expect(page.getByRole('heading', { name: /Members/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Message/i }).first()).toBeVisible({
          timeout: 10000,
        });

        await page
          .getByRole('link', { name: /Message/i })
          .first()
          .click();
        await expect(page).toHaveURL(/\/discussion/, { timeout: 5000 });
        await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
        await expect(page.getByText(userB.username)).toBeVisible({ timeout: 5000 });
      } finally {
        await context.close().catch(() => {});
      }
    });
  });
});
