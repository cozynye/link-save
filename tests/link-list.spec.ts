import { test, expect } from '@playwright/test';

test.describe('링크 목록 표시', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('빈 상태 메시지가 표시된다', async ({ page }) => {
    // 저장된 링크가 없을 때 빈 상태 메시지 확인
    await expect(
      page.locator('text=저장된 링크가 없습니다')
    ).toBeVisible();
  });

  test('링크 추가 후 목록에 표시된다', async ({ page }) => {
    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://react.dev');
    await page.fill('input[name="title"]', 'React 공식 문서');
    await page.fill(
      'textarea[name="description"]',
      'React의 새로운 공식 문서입니다'
    );

    // AI 태그 선택
    await page.locator('button:has-text("AI")').first().click();

    // 접근 키 입력
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');

    // 저장
    await page.click('button:has-text("저장")');

    // 다이얼로그가 닫힐 때까지 대기
    await expect(page.locator('text=새 링크 추가')).not.toBeVisible();

    // 링크 카드가 표시되는지 확인
    await expect(page.locator('text=React 공식 문서')).toBeVisible();
    await expect(page.locator('text=https://react.dev')).toBeVisible();
    await expect(
      page.locator('text=React의 새로운 공식 문서입니다')
    ).toBeVisible();

    // 태그가 표시되는지 확인
    const linkCard = page.locator('text=React 공식 문서').locator('..');
    await expect(linkCard.locator('text=AI')).toBeVisible();
  });

  test('링크 카드의 모든 정보가 올바르게 표시된다', async ({ page }) => {
    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://nextjs.org');
    await page.fill('input[name="title"]', 'Next.js Documentation');
    await page.fill('textarea[name="description"]', 'Next.js 공식 문서');
    await page.locator('button:has-text("React")').first().click();
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');

    // 카드 요소 확인
    await expect(page.locator('text=Next.js Documentation')).toBeVisible();
    await expect(page.locator('text=https://nextjs.org')).toBeVisible();
    await expect(page.locator('text=Next.js 공식 문서')).toBeVisible();

    // 날짜 표시 확인 (오늘 날짜 포함)
    const today = new Date();
    const year = today.getFullYear();
    await expect(page.locator(`text=${year}년`)).toBeVisible();
  });

  test('여러 개의 링크가 그리드로 표시된다', async ({ page }) => {
    // 첫 번째 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://react.dev');
    await page.fill('input[name="title"]', 'React Docs');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(500);

    // 두 번째 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://nextjs.org');
    await page.fill('input[name="title"]', 'Next.js Docs');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(500);

    // 세 번째 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://supabase.com');
    await page.fill('input[name="title"]', 'Supabase Docs');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(500);

    // 세 개의 링크가 모두 표시되는지 확인
    await expect(page.locator('text=React Docs')).toBeVisible();
    await expect(page.locator('text=Next.js Docs')).toBeVisible();
    await expect(page.locator('text=Supabase Docs')).toBeVisible();
  });

  test('외부 링크 아이콘이 표시된다', async ({ page }) => {
    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://example.com');
    await page.fill('input[name="title"]', 'Example Site');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');

    // 외부 링크 아이콘 버튼이 표시되는지 확인
    await expect(
      page.locator('button[aria-label="새 탭에서 열기"]')
    ).toBeVisible();
  });

  test('태그가 없는 링크도 올바르게 표시된다', async ({ page }) => {
    // 태그 없이 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://example.com');
    await page.fill('input[name="title"]', 'No Tags Link');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');

    // 링크 표시 확인
    await expect(page.locator('text=No Tags Link')).toBeVisible();
  });

  test('설명이 없는 링크도 올바르게 표시된다', async ({ page }) => {
    // 설명 없이 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://example.com');
    await page.fill('input[name="title"]', 'No Description Link');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');

    // 링크 표시 확인
    await expect(page.locator('text=No Description Link')).toBeVisible();
  });
});

test.describe('반응형 디자인 - 링크 목록', () => {
  test('모바일에서도 링크 목록이 정상 표시된다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://react.dev');
    await page.fill('input[name="title"]', 'React Mobile');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');

    // 링크 카드 표시 확인
    await expect(page.locator('text=React Mobile')).toBeVisible();
  });
});
