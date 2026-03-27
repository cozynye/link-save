import { test, expect } from '@playwright/test';
import { testId, LINK_DELETE } from '../helpers/selectors';

test.describe('Link Filter & Sort', () => {
  const titleA = testId('Filter Alpha');
  const titleB = testId('Filter Beta');

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: './tests/.auth/user.json',
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3010/link');

    // Create link A with tag "AI"
    await page.getByRole('button', { name: '링크 추가' }).first().click();
    await page.locator('#url').fill('https://example.com/filter-a');
    await page.locator('#title').fill(titleA);
    await page.getByRole('button', { name: 'AI' }).first().click();
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('새 링크 추가')).not.toBeVisible({ timeout: 10000 });

    // Create link B with tag "React"
    await page.getByRole('button', { name: '링크 추가' }).first().click();
    await page.locator('#url').fill('https://example.com/filter-b');
    await page.locator('#title').fill(titleB);
    await page.getByRole('button', { name: 'React' }).first().click();
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('새 링크 추가')).not.toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('search by title filters links', async ({ page }) => {
    await page.goto('/link');
    await expect(page.getByText(titleA)).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder('제목 또는 URL로 검색...').fill('Alpha');
    await page.waitForTimeout(500);

    await expect(page.getByText(titleA)).toBeVisible();
    await expect(page.getByText(titleB)).not.toBeVisible();
  });

  test('clear search shows all links', async ({ page }) => {
    await page.goto('/link');
    await page.getByPlaceholder('제목 또는 URL로 검색...').fill('Alpha');
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: '검색어 지우기' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(titleA)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(titleB)).toBeVisible();
  });

  test('filter by tag', async ({ page }) => {
    await page.goto('/link');
    await expect(page.getByText(titleA)).toBeVisible({ timeout: 10000 });

    // Click AI tag in the desktop filter (hidden md:block section)
    const filterSection = page.locator('.hidden.md\\:block');
    await filterSection.getByRole('button', { name: 'AI' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(titleA)).toBeVisible();
    await expect(page.getByText(titleB)).not.toBeVisible();

    // Clear filter
    await filterSection.getByRole('button', { name: '전체' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(titleB)).toBeVisible();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: './tests/.auth/user.json',
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3010/link');

    for (const title of [titleA, titleB]) {
      const card = page.locator('div[class*="card"]', { hasText: title }).first();
      if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
        await card.getByRole('button', { name: LINK_DELETE }).click();
        await page.locator('[role="alertdialog"]').getByRole('button', { name: '삭제' }).click();
        await expect(page.getByText(title)).not.toBeVisible({ timeout: 10000 });
      }
    }
    await context.close();
  });
});
