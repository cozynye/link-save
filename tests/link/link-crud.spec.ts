import { test, expect } from '@playwright/test';
import { testId, HEADER_TITLE, LINK_FORM_TITLE_NEW, LINK_EDIT, LINK_DELETE, LINK_EDIT_SAVE } from '../helpers/selectors';

// Helper: click the first "링크 추가" button (header one)
async function clickAddLink(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '링크 추가' }).first().click();
}

test.describe.serial('Link CRUD', () => {
  const uniqueTitle = testId('CRUD Link');
  const testUrl = 'https://playwright.dev';
  const updatedTitle = testId('Updated Link');

  test('link page loads', async ({ page }) => {
    await page.goto('/link');
    await expect(page.getByRole('heading', { name: HEADER_TITLE })).toBeVisible();
  });

  test('create link with URL and title', async ({ page }) => {
    await page.goto('/link');
    await clickAddLink(page);
    await expect(page.getByText(LINK_FORM_TITLE_NEW)).toBeVisible();

    await page.locator('#url').fill(testUrl);
    await page.locator('#title').fill(uniqueTitle);
    await page.locator('#description').fill('Test description for CRUD');

    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByText(LINK_FORM_TITLE_NEW)).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });
  });

  test('link card displays all info', async ({ page }) => {
    await page.goto('/link');
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

    const card = page.locator('div[class*="card"]', { hasText: uniqueTitle }).first();
    // Description should be visible
    await expect(card.getByText('Test description for CRUD')).toBeVisible();
  });

  test('edit link title', async ({ page }) => {
    await page.goto('/link');
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

    const card = page.locator('div[class*="card"]', { hasText: uniqueTitle }).first();
    await card.getByRole('button', { name: LINK_EDIT }).click();

    await expect(page.getByText('링크 수정')).toBeVisible();

    await page.locator('#title').clear();
    await page.locator('#title').fill(updatedTitle);

    await page.getByRole('button', { name: LINK_EDIT_SAVE }).click();

    await expect(page.getByText('링크 수정')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });
  });

  test('delete link', async ({ page }) => {
    await page.goto('/link');
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });

    const card = page.locator('div[class*="card"]', { hasText: updatedTitle }).first();
    await card.getByRole('button', { name: LINK_DELETE }).click();

    await expect(page.getByText('링크 삭제')).toBeVisible();

    // Click the confirm delete button in the dialog
    await page.locator('[role="alertdialog"]').getByRole('button', { name: '삭제' }).click();

    await expect(page.getByText(updatedTitle)).not.toBeVisible({ timeout: 10000 });
  });

  test('data persists after page refresh', async ({ page }) => {
    const persistTitle = testId('Persist Link');

    await page.goto('/link');
    await clickAddLink(page);
    await page.locator('#url').fill('https://example.com/persist');
    await page.locator('#title').fill(persistTitle);
    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByText(LINK_FORM_TITLE_NEW)).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(persistTitle)).toBeVisible({ timeout: 10000 });

    await page.reload();

    await expect(page.getByText(persistTitle)).toBeVisible({ timeout: 10000 });

    // Cleanup
    const card = page.locator('div[class*="card"]', { hasText: persistTitle }).first();
    await card.getByRole('button', { name: LINK_DELETE }).click();
    await page.locator('[role="alertdialog"]').getByRole('button', { name: '삭제' }).click();
    await expect(page.getByText(persistTitle)).not.toBeVisible({ timeout: 10000 });
  });
});
