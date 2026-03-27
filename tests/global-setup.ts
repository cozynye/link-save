import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required.\n' +
      'Set them before running tests:\n' +
      '  TEST_USER_EMAIL=your@email.com TEST_USER_PASSWORD=yourpass npx playwright test'
    );
  }

  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');

  // Wait for redirect away from login
  await expect(page).not.toHaveURL(/\/login/);

  await page.context().storageState({ path: authFile });
});
