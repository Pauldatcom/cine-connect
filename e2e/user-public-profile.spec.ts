/**
 * E2E Tests: Public user profile (/user/$id)
 *
 * Validates viewing another member's profile: username, member since, reviews,
 * and navigation from Members and back.
 */

import { expect, test } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
const password = process.env.E2E_TEST_PASSWORD;
if (!password) throw new Error('E2E_TEST_PASSWORD required (set in backend/.env or CI)');

async function registerUserViaApi(suffix: string) {
  const ts = Date.now();
  const r = Math.random().toString(36).slice(2, 8);
  const email = `e2e-pub-${ts}-${r}${suffix}@cineconnect.test`;
  const username = `pub${ts.toString().slice(-6)}${r}${suffix}`;
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
  const json = (await res.json()) as {
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

async function getPendingRequests(token: string): Promise<{ id: string; user: { id: string } }[]> {
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

test.describe('Public user profile (/user/$id)', () => {
  test('shows "User not found" and Back to Members for invalid user id', async ({ page }) => {
    await page.goto('/user/00000000-0000-0000-0000-000000000000');
    await expect(page.getByText(/user not found/i)).toBeVisible({ timeout: 10000 });
    const backLink = page.getByRole('link', { name: /back to members/i });
    await expect(backLink).toBeVisible();
    expect(await backLink.getAttribute('href')).toMatch(/\/members/);
  });

  test('navigating from Members opens public profile and shows username and sections', async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const userA = await registerUserViaApi('a');
    const userB = await registerUserViaApi('b');
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
      await expect(page.getByRole('heading', { name: /Members/i })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(userB.username)).toBeVisible({ timeout: 5000 });

      await page
        .getByRole('link', { name: new RegExp(userB.username, 'i') })
        .first()
        .click();
      await expect(page).toHaveURL(new RegExp(`/user/${userB.userId}`));
      await expect(page.getByRole('heading', { name: userB.username })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(/member since/i)).toBeVisible();
      await expect(page.getByRole('heading', { name: /^Reviews$/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /back to members/i })).toBeVisible();
    } finally {
      await context.close().catch(() => {});
    }
  });

  test('Back to Members link returns to /members', async ({ browser }) => {
    test.setTimeout(60000);
    const userA = await registerUserViaApi('ba');
    const userB = await registerUserViaApi('bb');
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

      await page.goto(`/user/${userB.userId}`);
      await expect(page.getByRole('heading', { name: userB.username })).toBeVisible({
        timeout: 10000,
      });
      await page.getByRole('link', { name: /back to members/i }).click();
      await expect(page).toHaveURL(/\/members/);
      await expect(page.getByRole('heading', { name: /Members/i })).toBeVisible();
    } finally {
      await context.close().catch(() => {});
    }
  });

  test('public profile shows "No reviews yet" when user has no reviews', async ({ browser }) => {
    test.setTimeout(60000);
    const userA = await registerUserViaApi('na');
    const userB = await registerUserViaApi('nb');
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

      await page.goto(`/user/${userB.userId}`);
      await expect(page.getByRole('heading', { name: userB.username })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(/no reviews yet/i)).toBeVisible({ timeout: 5000 });
    } finally {
      await context.close().catch(() => {});
    }
  });
});
