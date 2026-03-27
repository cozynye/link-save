import { test, expect } from '@playwright/test';
import { DOCS_PREVIEW_EMPTY } from '../helpers/selectors';

test.describe('Docs Markdown Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/new');
  });

  test('desktop shows split view (editor and preview)', async ({ page }) => {
    // Editor textarea should be visible
    await expect(page.locator('#content')).toBeVisible();
    // Preview label should be visible (using the Label component, not the mobile tab)
    await expect(page.locator('label:text("미리보기")')).toBeVisible();
  });

  test('empty preview shows placeholder message', async ({ page }) => {
    await expect(page.getByText(DOCS_PREVIEW_EMPTY)).toBeVisible();
  });

  test('preview renders markdown heading', async ({ page }) => {
    await page.locator('#content').fill('# Hello World');

    const preview = page.locator('.border.rounded-md.p-4');
    await expect(preview.locator('h1')).toContainText('Hello World');
  });

  test('preview renders markdown bold text', async ({ page }) => {
    await page.locator('#content').fill('This is **bold** text');

    const preview = page.locator('.border.rounded-md.p-4');
    await expect(preview.locator('strong')).toContainText('bold');
  });

  test('preview renders code blocks', async ({ page }) => {
    await page.locator('#content').fill('```js\nconst x = 1;\n```');

    const preview = page.locator('.border.rounded-md.p-4');
    await expect(preview.locator('code')).toBeVisible();
    await expect(preview.locator('code')).toContainText('const x = 1');
  });
});
