import { test, expect } from '@playwright/test';
import {
  LINK_ERROR_URL_REQUIRED,
  LINK_ERROR_URL_INVALID,
} from '../helpers/selectors';

test.describe('Link Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/link');
    await page.getByRole('button', { name: '링크 추가' }).first().click();
  });

  test('URL required', async ({ page }) => {
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(LINK_ERROR_URL_REQUIRED)).toBeVisible();
  });

  test('invalid URL format', async ({ page }) => {
    await page.locator('#url').fill('not-a-valid-url');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(LINK_ERROR_URL_INVALID)).toBeVisible();
  });

  test('title max 200 chars - form stays open', async ({ page }) => {
    await page.locator('#url').fill('https://example.com');
    await page.locator('#title').fill('a'.repeat(201));
    await page.getByRole('button', { name: '저장' }).click();

    // Form should stay open (validation prevents submission)
    await page.waitForTimeout(1000);
    await expect(page.getByText('새 링크 추가')).toBeVisible();
  });

  test('description max 500 chars - form stays open', async ({ page }) => {
    await page.locator('#url').fill('https://example.com');
    await page.locator('#description').fill('a'.repeat(501));
    await page.getByRole('button', { name: '저장' }).click();

    // Form should stay open (validation prevents submission)
    await page.waitForTimeout(1000);
    await expect(page.getByText('새 링크 추가')).toBeVisible();
  });
});
