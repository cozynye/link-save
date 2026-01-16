import { test, expect } from '@playwright/test';

test.describe.serial('Docs Domain - 백과사전 기능', () => {
  const accessKey = 'tlstnsehf1!';
  let testKeyword = `테스트키워드${Date.now()}`;
  const testEntry1 = {
    title: '첫 번째 엔트리',
    content: '# 제목\n\n이것은 **테스트** 내용입니다.\n\n## 코드 예제\n\n```javascript\nconsole.log("Hello World");\n```',
  };
  const testEntry2 = {
    title: '두 번째 엔트리',
    content: '# 추가 내용\n\n같은 키워드에 두 번째 엔트리를 추가합니다.',
  };

  test('Docs 메인 페이지 접속 및 헤더 네비게이션', async ({ page }) => {
    // SaveLink 메인 페이지 접속
    await page.goto('http://localhost:3010');
    await page.waitForLoadState('networkidle');

    // 헤더에 "SaveLink" (큼) + "Docs" (작은 링크) 확인
    await expect(page.locator('header h1:has-text("SaveLink")')).toBeVisible();
    await expect(page.locator('header a:has-text("Docs")')).toBeVisible();

    // Docs 링크 클릭
    await page.click('header a:has-text("Docs")');
    await page.waitForLoadState('networkidle');

    // Docs 페이지 확인
    await expect(page).toHaveURL(/\/docs$/);

    // 헤더에 "Docs" (큼) + "SaveLink" (작은 링크) 확인
    await expect(page.locator('header h1:has-text("Docs")')).toBeVisible();
    await expect(page.locator('header a:has-text("SaveLink")')).toBeVisible();

    // 백과사전 서브헤더 확인
    await expect(page.locator('h2:has-text("백과사전")')).toBeVisible();
  });

  test('새 엔트리 작성 - 새 키워드 생성', async ({ page }) => {
    await page.goto('http://localhost:3010/docs');
    await page.waitForLoadState('networkidle');

    // "새 엔트리" 버튼 클릭
    await page.click('button:has-text("새 엔트리")');
    await page.waitForLoadState('networkidle');

    // 새 엔트리 작성 페이지 확인
    await expect(page).toHaveURL(/\/docs\/new/);
    await expect(page.locator('h1:has-text("새 엔트리 작성")')).toBeVisible();

    // 폼 입력
    await page.fill('input[id="keyword"]', testKeyword);
    await page.fill('input[id="title"]', testEntry1.title);
    await page.fill('textarea[id="content"]', testEntry1.content);
    await page.fill('input[id="accessKey"]', accessKey);

    // 미리보기 확인 (데스크톱 split view)
    const previewLabel = page.locator('label:has-text("미리보기")');
    const previewLabelVisible = await previewLabel.isVisible();
    if (previewLabelVisible) {
      const preview = page.locator('.prose').first();
      await expect(preview).toContainText('제목');
      await expect(preview).toContainText('테스트');
    }

    // 저장 버튼 클릭
    await page.click('button[type="submit"]:has-text("저장")');

    // 키워드 페이지로 리다이렉트 대기
    await page.waitForURL(/\/docs\/[a-f0-9-]+/, { timeout: 10000 });

    // 엔트리가 타임라인에 표시되는지 확인
    await expect(page.locator(`h2:has-text("${testEntry1.title}")`)).toBeVisible();
    await expect(page.locator('.prose:has-text("테스트 내용")')).toBeVisible();
  });

  test('같은 키워드에 두 번째 엔트리 추가', async ({ page }) => {
    // 먼저 키워드 목록에서 테스트 키워드 찾기
    await page.goto('http://localhost:3010/docs');
    await page.waitForLoadState('networkidle');

    // 검색으로 키워드 찾기
    await page.fill('input[placeholder*="검색"]', testKeyword);
    await page.press('input[placeholder*="검색"]', 'Enter');
    await page.waitForTimeout(2000);

    // 키워드 카드 클릭
    const keywordCard = page.locator(`[data-slot="card"]:has(h2:has-text("${testKeyword}"))`).first();
    await keywordCard.waitFor({ timeout: 10000 });
    await keywordCard.click();
    await page.waitForURL(/\/docs\/[a-f0-9-]+/, { timeout: 10000 });

    // 키워드 상세 페이지 확인
    await expect(page.locator(`h1:has-text("${testKeyword}")`)).toBeVisible();

    // "추가" 버튼 클릭
    await page.click('button:has-text("추가")');
    await page.waitForURL(/\/docs\/new\?keyword=/);

    // 키워드가 자동으로 입력되어 있는지 확인
    const keywordInput = page.locator('input[id="keyword"]');
    await expect(keywordInput).toHaveValue(testKeyword);

    // 두 번째 엔트리 작성
    await page.fill('input[id="title"]', testEntry2.title);
    await page.fill('textarea[id="content"]', testEntry2.content);
    await page.fill('input[id="accessKey"]', accessKey);

    // 저장
    await page.click('button[type="submit"]:has-text("저장")');
    await page.waitForURL(/\/docs\/[a-f0-9-]+/);

    // 두 개의 엔트리가 모두 보이는지 확인
    await expect(page.locator(`h2:has-text("${testEntry1.title}")`)).toBeVisible();
    await expect(page.locator(`h2:has-text("${testEntry2.title}")`)).toBeVisible();
  });

  test('엔트리 수정', async ({ page }) => {
    // 키워드 페이지로 이동
    await page.goto('http://localhost:3010/docs');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="검색"]', testKeyword);
    await page.press('input[placeholder*="검색"]', 'Enter');
    await page.waitForTimeout(2000);

    const keywordCard = page.locator(`[data-slot="card"]:has(h2:has-text("${testKeyword}"))`).first();
    await keywordCard.waitFor({ timeout: 10000 });
    await keywordCard.click();
    await page.waitForURL(/\/docs\/[a-f0-9-]+/, { timeout: 10000 });

    // 첫 번째 엔트리의 수정 버튼 클릭 (첫 번째 Card 내의 첫 번째 버튼)
    const firstEntryCard = page.locator('.space-y-4 > div').first();
    const editButton = firstEntryCard.locator('button').first();
    await editButton.click();
    await page.waitForURL(/\/docs\/edit\//, { timeout: 10000 });

    // 수정 페이지 확인
    await expect(page.locator('h1:has-text("엔트리 수정")')).toBeVisible();

    // 내용 수정
    const updatedContent = testEntry1.content + '\n\n## 수정됨\n\n수정된 내용입니다.';
    await page.fill('textarea[id="content"]', updatedContent);
    await page.fill('input[id="accessKey"]', accessKey);

    // 저장
    await page.click('button[type="submit"]:has-text("수정")');
    await page.waitForURL(/\/docs\/[a-f0-9-]+/);

    // 수정된 내용 확인
    await expect(page.locator('.prose:has-text("수정된 내용입니다")')).toBeVisible();
  });

  test('엔트리 삭제', async ({ page }) => {
    // 키워드 페이지로 이동
    await page.goto('http://localhost:3010/docs');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="검색"]', testKeyword);
    await page.press('input[placeholder*="검색"]', 'Enter');
    await page.waitForTimeout(2000);

    // 키워드 카드가 나타날 때까지 대기
    const keywordCard = page.locator(`[data-slot="card"]:has(h2:has-text("${testKeyword}"))`).first();
    await keywordCard.waitFor({ timeout: 10000 });
    await keywordCard.click();

    // URL 변경될 때까지 대기
    await page.waitForURL(/\/docs\/[a-f0-9-]+/, { timeout: 10000 });

    // 엔트리가 로드될 때까지 대기
    await page.waitForSelector('[data-slot="card"]', { timeout: 10000 });

    // 엔트리 개수 확인
    const entryCards = page.locator('[data-slot="card"]');
    const entryCountBefore = await entryCards.count();
    expect(entryCountBefore).toBeGreaterThan(0);

    // 삭제 버튼 클릭 (첫 번째 엔트리의 두 번째 버튼)
    const firstEntryCard = entryCards.first();
    const deleteButton = firstEntryCard.locator('button').nth(1);
    await deleteButton.click();

    // 삭제 다이얼로그 확인
    await expect(page.locator('text=엔트리 삭제')).toBeVisible();

    // 접근 키 입력
    await page.fill('input[id="delete-access-key"]', accessKey);

    // 삭제 확인
    await page.click('button:has-text("삭제")');

    // 엔트리가 실제로 삭제되어 DOM에서 제거될 때까지 대기
    // Before: 1 entry, After: should be 0 entries
    await page.waitForFunction(
      (expectedCount) => {
        const cards = document.querySelectorAll('[data-slot="card"]');
        return cards.length < expectedCount;
      },
      entryCountBefore,
      { timeout: 5000 }
    );

    // 엔트리가 삭제되었는지 확인 (개수 감소)
    const entryCountAfter = await page.locator('[data-slot="card"]').count();
    expect(entryCountAfter).toBeLessThan(entryCountBefore);
  });

  test('MD 에디터 - 모바일 탭 전환', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3010/docs/new');
    await page.waitForLoadState('networkidle');

    // 탭이 보이는지 확인
    await expect(page.locator('button:has-text("편집")')).toBeVisible();
    await expect(page.locator('button:has-text("미리보기")')).toBeVisible();

    // 내용 입력
    await page.fill('textarea[id="content"]', '# 테스트\n\n모바일 테스트');

    // 미리보기 탭으로 전환
    await page.click('button:has-text("미리보기")');
    await page.waitForTimeout(500);

    // 미리보기 내용 확인
    await expect(page.locator('.prose:has-text("모바일 테스트")')).toBeVisible();

    // 편집 탭으로 다시 전환
    await page.click('button:has-text("편집")');
    await page.waitForTimeout(500);

    // textarea가 다시 보이는지 확인
    await expect(page.locator('textarea[id="content"]')).toBeVisible();
  });

  test('Docs와 SaveLink 간 네비게이션', async ({ page }) => {
    // Docs 시작
    await page.goto('http://localhost:3010/docs');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('header h1:has-text("Docs")')).toBeVisible();

    // SaveLink로 이동
    await page.click('header a:has-text("SaveLink")');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL('http://localhost:3010/');
    await expect(page.locator('header h1:has-text("SaveLink")')).toBeVisible();

    // 다시 Docs로 이동
    await page.click('header a:has-text("Docs")');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/docs$/);
    await expect(page.locator('header h1:has-text("Docs")')).toBeVisible();
  });
});
