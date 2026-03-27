import { test, expect } from '@playwright/test';
import {
  LOGIN_HEADING,
  LOGIN_SUBMIT,
  LOGIN_LOADING,
  LOGIN_ERROR_EMPTY,
  LOGIN_ERROR_INVALID,
} from '../helpers/selectors';

// These tests must NOT use storageState (run unauthenticated)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: LOGIN_HEADING })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: LOGIN_SUBMIT })).toBeVisible();
  });

  test('empty fields show error', async ({ page }) => {
    await page.goto('/login');

    // HTML5 required attribute will prevent submission,
    // but the custom validation also checks
    await page.locator('#email').fill('');
    await page.locator('#password').fill('');

    // Force form submission by removing required attributes
    await page.locator('#email').evaluate((el) => el.removeAttribute('required'));
    await page.locator('#password').evaluate((el) => el.removeAttribute('required'));
    await page.getByRole('button', { name: LOGIN_SUBMIT }).click();

    await expect(page.getByText(LOGIN_ERROR_EMPTY)).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: LOGIN_SUBMIT }).click();

    // Wait for error message
    await expect(page.getByText(LOGIN_ERROR_INVALID)).toBeVisible({ timeout: 10000 });
  });

  test('successful login redirects to home', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto('/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: LOGIN_SUBMIT }).click();

    // Button should show loading state
    await expect(page.getByRole('button', { name: LOGIN_LOADING })).toBeVisible();

    // Should redirect away from login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('returnUrl redirect works after login', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (!email || !password) {
      test.skip();
      return;
    }

    await page.goto('/login?returnUrl=/link');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: LOGIN_SUBMIT }).click();

    await expect(page).toHaveURL(/\/link/, { timeout: 10000 });
  });
});
