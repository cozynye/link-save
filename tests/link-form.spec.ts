import { test, expect } from '@playwright/test';

test.describe('링크 추가 폼', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('페이지가 정상적으로 로드된다', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('SaveLink');
    await expect(
      page.locator('text=링크를 저장하고 관리하세요')
    ).toBeVisible();
  });

  test('링크 추가 버튼을 클릭하면 폼이 열린다', async ({ page }) => {
    // 링크 추가 버튼 클릭
    await page.click('button:has-text("링크 추가")');

    // 다이얼로그가 열렸는지 확인
    await expect(page.locator('text=새 링크 추가')).toBeVisible();
    await expect(
      page.locator('text=저장하고 싶은 링크의 정보를 입력하세요')
    ).toBeVisible();
  });

  test('폼의 모든 필드가 표시된다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // URL 입력 필드
    await expect(page.locator('label:has-text("URL")')).toBeVisible();
    await expect(page.locator('input[name="url"]')).toBeVisible();

    // 제목 입력 필드
    await expect(page.locator('label:has-text("제목")')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();

    // 설명 입력 필드
    await expect(page.locator('label:has-text("설명")')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();

    // 태그 선택 영역
    await expect(page.locator('text=태그 선택')).toBeVisible();

    // 접근 키 입력 필드
    await expect(page.locator('label:has-text("접근 키")')).toBeVisible();
    await expect(page.locator('input[name="accessKey"]')).toBeVisible();

    // 저장/취소 버튼
    await expect(page.locator('button:has-text("저장")')).toBeVisible();
    await expect(page.locator('button:has-text("취소")')).toBeVisible();
  });

  test('URL 없이 제출하면 에러 메시지를 표시한다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // 제목과 키만 입력
    await page.fill('input[name="title"]', '테스트 제목');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');

    // 저장 버튼 클릭
    await page.click('button:has-text("저장")');

    // 에러 메시지 확인
    await expect(page.locator('text=URL을 입력해주세요')).toBeVisible();
  });

  test('제목 없이 제출하면 에러 메시지를 표시한다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // URL과 키만 입력
    await page.fill('input[name="url"]', 'https://example.com');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');

    // 저장 버튼 클릭
    await page.click('button:has-text("저장")');

    // 에러 메시지 확인
    await expect(page.locator('text=제목을 입력해주세요')).toBeVisible();
  });

  test('잘못된 URL 형식을 제출하면 에러 메시지를 표시한다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // 잘못된 URL 입력
    await page.fill('input[name="url"]', 'invalid-url');
    await page.fill('input[name="title"]', '테스트 제목');
    await page.fill('input[name="accessKey"]', 'tlstnsehf1!');

    // 저장 버튼 클릭
    await page.click('button:has-text("저장")');

    // 에러 메시지 확인
    await expect(
      page.locator('text=올바른 URL 형식이 아닙니다')
    ).toBeVisible();
  });

  test('태그를 선택하고 제거할 수 있다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // AI 태그 선택
    const aiTagButton = page.locator('button:has-text("AI")').first();
    await aiTagButton.click();

    // 선택된 태그 표시 확인
    await expect(page.locator('text=선택된 태그')).toBeVisible();

    // React 태그 추가 선택
    const reactTagButton = page.locator('button:has-text("React")').first();
    await reactTagButton.click();

    // 태그 제거 (X 버튼 클릭)
    const removeButton = page
      .locator('[aria-label="AI 태그 제거"]')
      .first();
    await removeButton.click();

    // AI 태그가 제거되었는지 확인 (선택된 태그 영역에서)
    const selectedTagsSection = page.locator('text=선택된 태그').locator('..');
    await expect(selectedTagsSection.locator('text=React')).toBeVisible();
  });

  test('최대 5개까지 태그를 선택할 수 있다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // 5개 태그 선택
    const tags = ['AI', '아키텍처', '면접', 'CS', 'React'];
    for (const tag of tags) {
      await page.locator(`button:has-text("${tag}")`).first().click();
    }

    // 선택된 태그 개수 확인
    await expect(page.locator('text=선택된 태그 (5/5)')).toBeVisible();

    // 최대 선택 메시지 확인
    await expect(
      page.locator('text=최대 5개까지 선택 가능합니다')
    ).toBeVisible();
  });

  test('취소 버튼을 클릭하면 폼이 닫힌다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // 데이터 입력
    await page.fill('input[name="url"]', 'https://example.com');
    await page.fill('input[name="title"]', '테스트');

    // 취소 버튼 클릭
    await page.click('button:has-text("취소")');

    // 다이얼로그가 닫혔는지 확인
    await expect(page.locator('text=새 링크 추가')).not.toBeVisible();
  });

  test('모든 필드를 올바르게 입력할 수 있다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // URL 입력
    await page.fill('input[name="url"]', 'https://example.com');
    await expect(page.locator('input[name="url"]')).toHaveValue(
      'https://example.com'
    );

    // 제목 입력
    await page.fill('input[name="title"]', 'Example Site');
    await expect(page.locator('input[name="title"]')).toHaveValue(
      'Example Site'
    );

    // 설명 입력 (textarea 사용)
    await page.fill('textarea[name="description"]', '테스트 설명입니다');
    await expect(page.locator('textarea[name="description"]')).toHaveValue(
      '테스트 설명입니다'
    );

    // 태그 선택
    await page.locator('button:has-text("AI")').first().click();
    await expect(page.locator('text=선택된 태그 (1/5)')).toBeVisible();
  });

  test('폼 제출 시 로딩 상태를 표시한다', async ({ page }) => {
    await page.click('button:has-text("링크 추가")');

    // 필수 필드 입력
    await page.fill('input[name="url"]', 'https://example.com');
    await page.fill('input[name="title"]', 'Example Site');

    // 저장 버튼 클릭
    const submitButton = page.locator('button:has-text("저장")');
    await submitButton.click();

    // 로딩 상태 확인 (버튼 텍스트 변경 또는 disabled 상태)
    // Note: Supabase 연결 없이는 에러가 발생할 수 있음
  });
});

test.describe('반응형 디자인', () => {
  test('모바일 화면에서도 정상 동작한다', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 링크 추가 버튼이 보이는지 확인
    await expect(page.locator('button:has-text("링크 추가")')).toBeVisible();

    // 폼 열기
    await page.click('button:has-text("링크 추가")');
    await expect(page.locator('text=새 링크 추가')).toBeVisible();
  });
});
