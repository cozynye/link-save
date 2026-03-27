import { test, expect } from '@playwright/test';
import {
  DOCS_NO_KEYWORDS,
  DOCS_FIRST_ENTRY,
  DOCS_NO_SEARCH_RESULTS,
  DOCS_SEARCH_PLACEHOLDER,
} from '../helpers/selectors';

test.describe('Docs Keywords Page', () => {
  test('docs page loads', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: '기억' })).toBeVisible();
  });

  test('new entry button visible', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('link', { name: '새 엔트리' })).toBeVisible();
  });

  test('search with no results shows message', async ({ page }) => {
    await page.goto('/docs');
    await page.getByPlaceholder(DOCS_SEARCH_PLACEHOLDER).fill('zzzznonexistent999');
    await page.getByPlaceholder(DOCS_SEARCH_PLACEHOLDER).press('Enter');

    await expect(page.getByText(DOCS_NO_SEARCH_RESULTS)).toBeVisible({ timeout: 10000 });
  });

  test('sort toggle switches between 최신순 and 이름순', async ({ page }) => {
    await page.goto('/docs');

    const sortButton = page.getByRole('button', { name: '최신순' });
    await expect(sortButton).toBeVisible();

    await sortButton.click();
    await expect(page.getByRole('button', { name: '이름순' })).toBeVisible();

    await page.getByRole('button', { name: '이름순' }).click();
    await expect(page.getByRole('button', { name: '최신순' })).toBeVisible();
  });
});
