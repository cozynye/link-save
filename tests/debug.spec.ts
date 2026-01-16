import { test, expect } from '@playwright/test';

test('디버그 - 페이지 상태 확인', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // 콘솔 메시지 캡처
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // 에러 캡처
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  // 페이지 로드
  await page.goto('/');

  // 3초 대기
  await page.waitForTimeout(3000);

  // 페이지 스크린샷
  await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });

  // 페이지 HTML
  const html = await page.content();

  console.log('\n===== 콘솔 메시지 =====');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n===== 에러 =====');
  errors.forEach(err => console.log(err));

  console.log('\n===== 페이지 내용 (일부) =====');
  console.log(html.substring(0, 500));

  // 빈 상태 메시지 또는 로딩 메시지 확인
  const bodyText = await page.locator('body').innerText();
  console.log('\n===== 페이지 텍스트 =====');
  console.log(bodyText);
});
