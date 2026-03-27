import { test, expect } from '@playwright/test';
import { testId, LINK_DELETE } from '../helpers/selectors';

test.describe.serial('Link Pin/Unpin', () => {
  const pinTitle = testId('Pin Test');

  test('create a link for pin testing', async ({ page }) => {
    await page.goto('/link');
    await page.getByRole('button', { name: '링크 추가' }).first().click();
    await page.locator('#url').fill('https://example.com/pin-test');
    await page.locator('#title').fill(pinTitle);
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('새 링크 추가')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(pinTitle)).toBeVisible({ timeout: 10000 });
  });

  test('pin a link and verify persistence', async ({ page }) => {
    await page.goto('/link');
    await expect(page.getByText(pinTitle)).toBeVisible({ timeout: 10000 });

    const card = page.locator('div[class*="card"]', { hasText: pinTitle }).first();
    await card.getByText('고정', { exact: true }).click();

    // After pinning, text should change to "해제"
    await expect(card.getByText('해제', { exact: true })).toBeVisible({ timeout: 5000 });

    // Wait for server to persist the change
    await page.waitForTimeout(2000);

    // Refresh and verify pin persists
    await page.reload();
    await expect(page.getByText(pinTitle)).toBeVisible({ timeout: 10000 });
    const cardAfterRefresh = page.locator('div[class*="card"]', { hasText: pinTitle }).first();
    await expect(cardAfterRefresh.getByText('해제', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('unpin a link', async ({ page }) => {
    await page.goto('/link');
    await expect(page.getByText(pinTitle)).toBeVisible({ timeout: 10000 });

    const card = page.locator('div[class*="card"]', { hasText: pinTitle }).first();
    // Wait for pin state to be loaded
    await expect(card.getByText('해제', { exact: true })).toBeVisible({ timeout: 10000 });
    await card.getByText('해제', { exact: true }).click();

    await expect(card.getByText('고정', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('cleanup: delete test link', async ({ page }) => {
    await page.goto('/link');
    const card = page.locator('div[class*="card"]', { hasText: pinTitle }).first();
    if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
      await card.getByRole('button', { name: LINK_DELETE }).click();
      await page.locator('[role="alertdialog"]').getByRole('button', { name: '삭제' }).click();
      await expect(page.getByText(pinTitle)).not.toBeVisible({ timeout: 10000 });
    }
  });
});
