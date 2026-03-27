import { test, expect } from '@playwright/test';
import { HEADER_TITLE, NAV_LINK, NAV_DOCS, LOGOUT_BUTTON } from '../helpers/selectors';

test.describe('Navigation', () => {
  test('"기억" header links to home', async ({ page }) => {
    await page.goto('/link');
    await page.getByRole('heading', { name: HEADER_TITLE }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test('"Link" nav goes to /link', async ({ page }) => {
    await page.goto('/docs');
    await page.getByRole('link', { name: NAV_LINK }).click();
    await expect(page).toHaveURL(/\/link/, { timeout: 10000 });
  });

  test('"Docs" nav goes to /docs', async ({ page }) => {
    await page.goto('/link');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('link', { name: NAV_DOCS }).click();
    await expect(page).toHaveURL(/\/docs/, { timeout: 10000 });
  });

  test('logout button visible on protected pages', async ({ page }) => {
    await page.goto('/link');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: LOGOUT_BUTTON })).toBeVisible({ timeout: 10000 });
  });

  test('logout redirects to home', async ({ page }) => {
    await page.goto('/link');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: LOGOUT_BUTTON })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: LOGOUT_BUTTON }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });
});
