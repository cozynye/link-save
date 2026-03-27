import { test, expect } from '@playwright/test';
import { LINK_AUTO_FILL, LINK_AUTO_FILL_LOADING } from '../helpers/selectors';

test.describe('Link Metadata Auto-fill', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/link');
    await page.getByRole('button', { name: '링크 추가' }).first().click();
  });

  test('auto-fill button disabled without URL', async ({ page }) => {
    const autoFillButton = page.getByRole('button', { name: LINK_AUTO_FILL });
    await expect(autoFillButton).toBeDisabled();
  });

  test('auto-fill button enabled with URL', async ({ page }) => {
    await page.locator('#url').fill('https://example.com');
    const autoFillButton = page.getByRole('button', { name: LINK_AUTO_FILL });
    await expect(autoFillButton).toBeEnabled();
  });

  test('auto-fill fetches metadata', async ({ page }) => {
    await page.locator('#url').fill('https://example.com');
    await page.getByRole('button', { name: LINK_AUTO_FILL }).click();

    // Should show loading state
    await expect(page.getByText(LINK_AUTO_FILL_LOADING)).toBeVisible();

    // Wait for loading to finish
    await expect(page.getByRole('button', { name: LINK_AUTO_FILL })).toBeVisible({ timeout: 15000 });

    // Title field should be filled
    const titleValue = await page.locator('#title').inputValue();
    expect(titleValue.length).toBeGreaterThan(0);
  });

  test('auto-fill does not overwrite existing title', async ({ page }) => {
    const manualTitle = 'My Manual Title';
    await page.locator('#url').fill('https://example.com');
    await page.locator('#title').fill(manualTitle);

    await page.getByRole('button', { name: LINK_AUTO_FILL }).click();
    await expect(page.getByRole('button', { name: LINK_AUTO_FILL })).toBeVisible({ timeout: 15000 });

    await expect(page.locator('#title')).toHaveValue(manualTitle);
  });
});
