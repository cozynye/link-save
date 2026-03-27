import { test, expect } from '@playwright/test';
import { testId } from '../helpers/selectors';

test.describe.serial('Docs Entry CRUD', () => {
  const keywordName = testId('TestKeyword');
  const entryContent = '# Test Entry\n\nThis is test content for E2E testing.';
  const updatedContent = '# Updated Entry\n\nThis content has been updated.';
  let keywordUrl: string;

  test('navigate to new entry page', async ({ page }) => {
    await page.goto('/docs');
    await page.getByRole('link', { name: '새 엔트리' }).click();
    await expect(page).toHaveURL(/\/docs\/new/);
  });

  test('new entry form has required fields', async ({ page }) => {
    await page.goto('/docs/new');
    await expect(page.locator('#keyword')).toBeVisible();
    await expect(page.locator('#content')).toBeVisible();
  });

  test('content required validation', async ({ page }) => {
    await page.goto('/docs/new');
    await page.locator('#keyword').fill('test');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('내용을 입력해주세요')).toBeVisible();
  });

  test('create entry with new keyword', async ({ page }) => {
    await page.goto('/docs/new');

    await page.locator('#keyword').fill(keywordName);
    await page.locator('#title').fill('First Entry');
    await page.locator('#content').fill(entryContent);

    await page.getByRole('button', { name: '저장' }).click();

    // Should redirect to keyword detail page
    await expect(page).toHaveURL(/\/docs\/[a-f0-9-]+/, { timeout: 15000 });
    keywordUrl = page.url();

    // Entry content should be visible (rendered markdown)
    await expect(page.getByText('Test Entry')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('First Entry')).toBeVisible();
  });

  test('keyword appears in docs list with count', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByText(keywordName)).toBeVisible({ timeout: 10000 });
  });

  test('click keyword navigates to detail', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByText(keywordName)).toBeVisible({ timeout: 10000 });
    await page.getByText(keywordName).click();
    await expect(page).toHaveURL(/\/docs\/[a-f0-9-]+/);
  });

  test('edit entry', async ({ page }) => {
    await page.goto(keywordUrl);
    await expect(page.getByText('First Entry')).toBeVisible({ timeout: 10000 });

    // Click edit button - it's a small ghost button with Edit/SquarePen SVG icon
    // The entry card has two buttons: edit and delete
    const entryCard = page.locator('div[class*="card"]', { hasText: 'First Entry' }).first();
    // Edit button is the first button in the action group
    const buttons = entryCard.locator('button[data-variant="ghost"]');
    await buttons.first().click();

    await expect(page).toHaveURL(/\/docs\/edit\/[a-f0-9-]+/, { timeout: 10000 });

    // Wait for entry data to load via useEffect
    await expect(page.locator('#content')).not.toHaveValue('', { timeout: 10000 });

    const contentValue = await page.locator('#content').inputValue();
    expect(contentValue).toContain('Test Entry');

    await page.locator('#content').clear();
    await page.locator('#content').fill(updatedContent);

    await page.getByRole('button', { name: '수정' }).click();

    // Wait for redirect back to keyword detail page (not edit page)
    await expect(page).not.toHaveURL(/\/docs\/edit\//, { timeout: 15000 });
    await expect(page).toHaveURL(/\/docs\/[a-f0-9-]+$/, { timeout: 10000 });
    // Update keywordUrl after edit redirect
    keywordUrl = page.url();

    // Wait for content to render
    await page.waitForTimeout(1000);

    // Verify the page shows updated content (check any part of it)
    const pageContent = await page.content();
    expect(pageContent).toContain('Updated Entry');

    // Data persists after refresh
    await page.reload();
    await page.waitForTimeout(2000);
    const reloadedContent = await page.content();
    expect(reloadedContent).toContain('Updated Entry');
  });

  test('delete entry', async ({ page }) => {
    await page.goto(keywordUrl);
    await page.waitForTimeout(2000);

    // Find the Trash2 icon button for delete
    const trashButton = page.locator('button:has(svg.lucide-trash-2)').first();
    await trashButton.click({ timeout: 10000 });

    await expect(page.getByText('엔트리 삭제')).toBeVisible();

    // Confirm delete in the alert dialog
    await page.locator('[role="alertdialog"]').getByRole('button', { name: '삭제' }).click();
    await expect(page.getByText('아직 엔트리가 없습니다')).toBeVisible();
  });
});
