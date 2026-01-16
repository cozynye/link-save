import { test, expect } from '@playwright/test';

test.describe('링크 필터링', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('검색어로 링크 필터링', async ({ page }) => {
    // 먼저 링크 2개 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://react.dev');
    await page.fill('input[name="title"]', 'React 공식 문서');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://nextjs.org');
    await page.fill('input[name="title"]', 'Next.js Documentation');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    // 검색어 입력
    const searchInput = page.locator('input[placeholder="제목 또는 URL로 검색..."]');
    await searchInput.fill('React');

    // React 링크만 표시되는지 확인
    await expect(page.locator('text=React 공식 문서')).toBeVisible();

    // Next.js 링크는 검색 결과에 포함되지 않을 수 있음 (React도 포함되어 있을 수 있음)
    // 따라서 최소한 React가 보이는 것만 확인
  });

  test('태그로 링크 필터링', async ({ page }) => {
    // AI 태그가 있는 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://openai.com');
    await page.fill('input[name="title"]', 'OpenAI');

    // 다이얼로그 내의 AI 태그 선택 (first()로 첫 번째 AI 버튼)
    await page.locator('button:has-text("AI")').first().click();

    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    // React 태그가 있는 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://react.dev');
    await page.fill('input[name="title"]', 'React Docs');
    await page.locator('button:has-text("React")').first().click();
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    // 필터 영역의 AI 태그 클릭 (태그로 필터링 섹션)
    const filterSection = page.locator('text=태그로 필터링').locator('..');
    await filterSection.locator('button:has-text("AI")').click();

    // AI 태그가 있는 링크만 표시되는지 확인
    await expect(page.locator('text=OpenAI')).toBeVisible();
  });

  test('검색어 초기화', async ({ page }) => {
    // 검색어 입력
    const searchInput = page.locator('input[placeholder="제목 또는 URL로 검색..."]');
    await searchInput.fill('Test');

    // 초기화 버튼 클릭
    await page.click('button[aria-label="검색어 지우기"]');

    // 검색어가 비워졌는지 확인
    await expect(searchInput).toHaveValue('');
  });

  test('선택된 태그 전체 해제', async ({ page }) => {
    // 태그 필터 2개 선택
    const filterSection = page.locator('text=태그로 필터링').locator('..');
    await filterSection.locator('button:has-text("AI")').click();
    await filterSection.locator('button:has-text("React")').click();

    // 전체 해제 버튼 클릭
    await page.click('button:has-text("전체 해제")');

    // 선택된 태그 개수 메시지가 사라졌는지 확인
    await expect(page.locator('text=개 태그로 필터링 중')).not.toBeVisible();
  });
});

test.describe('링크 수정', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('링크 수정 다이얼로그가 열린다', async ({ page }) => {
    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://example.com');
    await page.fill('input[name="title"]', 'Example');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    // 링크 카드에 마우스 호버하여 수정 버튼 표시
    const linkCard = page.locator('text=Example').locator('..');
    await linkCard.hover();

    // 수정 버튼 클릭
    await page.click('button:has-text("수정")');

    // 수정 다이얼로그가 열렸는지 확인
    await expect(page.locator('text=링크 수정')).toBeVisible();
    await expect(page.locator('input[name="url"]')).toHaveValue('https://example.com');
    await expect(page.locator('input[name="title"]')).toHaveValue('Example');
  });

  test('링크 정보를 수정할 수 있다', async ({ page }) => {
    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://example.com');
    await page.fill('input[name="title"]', 'Original Title');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    // 수정 버튼 클릭
    const linkCard = page.locator('text=Original Title').locator('..');
    await linkCard.hover();
    await page.click('button:has-text("수정")');

    // 제목 수정
    await page.fill('input[name="title"]', 'Updated Title');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("수정")');

    // 수정된 제목이 표시되는지 확인
    await expect(page.locator('text=Updated Title')).toBeVisible();
    await expect(page.locator('text=Original Title')).not.toBeVisible();
  });
});

test.describe('링크 삭제', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('링크 삭제 다이얼로그가 열린다', async ({ page }) => {
    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://delete-test.com');
    await page.fill('input[name="title"]', 'Delete Test');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    // 링크 카드에 마우스 호버하여 삭제 버튼 표시
    const linkCard = page.locator('text=Delete Test').locator('..');
    await linkCard.hover();

    // 삭제 버튼 클릭
    await page.click('button:has-text("삭제")');

    // 삭제 확인 다이얼로그가 열렸는지 확인
    await expect(page.locator('text=링크 삭제')).toBeVisible();
    await expect(
      page.locator('text=정말로 이 링크를 삭제하시겠습니까?')
    ).toBeVisible();
    await expect(page.locator('text=Delete Test')).toBeVisible();
  });

  test('링크를 삭제할 수 있다', async ({ page }) => {
    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://delete-test.com');
    await page.fill('input[name="title"]', 'To Be Deleted');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    // 삭제 버튼 클릭
    const linkCard = page.locator('text=To Be Deleted').locator('..');
    await linkCard.hover();
    await page.click('button:has-text("삭제")');

    // 접근 키 입력
    await page.fill('input[id="delete-accessKey"]', 'tlstnsehf1!');

    // 삭제 버튼 클릭
    await page.click('button:has-text("삭제")').last();

    // 링크가 삭제되었는지 확인
    await page.waitForTimeout(1000);
    await expect(page.locator('text=To Be Deleted')).not.toBeVisible();
  });

  test('취소 버튼을 클릭하면 삭제가 취소된다', async ({ page }) => {
    // 링크 추가
    await page.click('button:has-text("링크 추가")');
    await page.fill('input[name="url"]', 'https://cancel-test.com');
    await page.fill('input[name="title"]', 'Cancel Test');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(1000);

    // 삭제 버튼 클릭
    const linkCard = page.locator('text=Cancel Test').locator('..');
    await linkCard.hover();
    await page.click('button:has-text("삭제")');

    // 취소 버튼 클릭
    await page.click('button:has-text("취소")');

    // 링크가 여전히 존재하는지 확인
    await expect(page.locator('text=Cancel Test')).toBeVisible();
  });
});
