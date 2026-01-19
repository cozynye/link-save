# 변경 이력 - 2026년 1월 19일

## 📝 요약

**문제**:
1. 유저 ID 필터링이 하드코딩된 DEFAULT_USER_ID를 사용해서 모든 사용자가 같은 데이터를 봄
2. 리스트에서 데이터 순서를 쉽게 확인할 수 없음
3. Supabase 테이블에서 삽입 순서를 명확하게 볼 수 없음

**해결**:
1. ✅ 실제 로그인한 사용자 ID로 데이터 필터링
2. ✅ UI에 순번(1, 2, 3...) 표시 추가
3. ✅ Supabase 테이블에 row_number 컬럼 추가 (표준화)

---

## 🔧 코드 변경 사항

### 1. 유저 ID 필터링 수정

#### `src/domains/Link/hooks/useLinksQuery.ts`
```diff
- import { DEFAULT_USER_ID } from '@/constants/config';
+ import { getCurrentUserId } from '@/lib/auth';

  async function fetchLinks(filterOptions?: LinkFilterOptions): Promise<Link[]> {
+   // 현재 로그인한 사용자 ID 가져오기
+   const userId = await getCurrentUserId();
+
+   if (!userId) {
+     throw new Error('로그인이 필요합니다');
+   }

    let query = supabase
      .from('links')
      .select('*')
-     .eq('user_id', DEFAULT_USER_ID);
+     .eq('user_id', userId);
```

#### `src/domains/Docs/hooks/useKeywordsQuery.ts`
```diff
- import { DEFAULT_USER_ID } from '@/constants/config';
+ import { getCurrentUserId } from '@/lib/auth';

  async function fetchKeywords(filterOptions: DocsFilterOptions = {}): Promise<KeywordWithCount[]> {
+   // 현재 로그인한 사용자 ID 가져오기
+   const userId = await getCurrentUserId();
+
+   if (!userId) {
+     throw new Error('로그인이 필요합니다');
+   }

    let query = supabase
      .from('keywords')
      .select('*')
-     .eq('user_id', DEFAULT_USER_ID);
+     .eq('user_id', userId);
```

### 2. UI 인덱스 표시 추가

#### `src/domains/Link/components/LinkCard/index.tsx`
```diff
  interface LinkCardProps {
    link: Link;
+   index?: number;
    onEdit?: (link: Link) => void;
    onDelete?: (link: Link) => void;
    onTogglePin?: (link: Link) => void;
  }

- export function LinkCard({ link, onEdit, onDelete, onTogglePin }: LinkCardProps) {
+ export function LinkCard({ link, index, onEdit, onDelete, onTogglePin }: LinkCardProps) {
    return (
      <Card className="group hover:shadow-lg transition-shadow relative">
+       {/* 인덱스 번호 */}
+       {index !== undefined && (
+         <div className="absolute top-2 left-2 z-10">
+           <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-semibold">
+             {index}
+           </div>
+         </div>
+       )}
```

#### `src/domains/Link/components/LinkList/index.tsx`
```diff
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
-     {links.map((link) => (
+     {links.map((link, index) => (
        <LinkCard
          key={link.id}
          link={link}
+         index={index + 1}
          onEdit={onEditLink}
          onDelete={onDeleteLink}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
```

#### `src/app/docs/page.tsx`
```diff
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
-   {keywords.map((keyword) => (
+   {keywords.map((keyword, index) => (
      <Card
        key={keyword.id}
-       className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
+       className="p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
        onClick={() => handleKeywordClick(keyword.id)}
      >
+       {/* 인덱스 번호 */}
+       <div className="absolute top-2 left-2 z-10">
+         <div className="flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-semibold">
+           {index + 1}
+         </div>
+       </div>
-       <div className="space-y-3">
+       <div className="space-y-3 mt-6">
```

---

## 📊 새로 생성된 파일

### 데이터베이스 마이그레이션
```
supabase/
├── migrations/
│   └── add_row_number_columns.sql    # links, keywords, keyword_entries 테이블에 row_number 추가
├── TABLE_TEMPLATE.sql                 # 새 테이블 생성 템플릿 (row_number 포함)
└── README_row_number.md              # row_number 사용 가이드
```

### 프로젝트 문서
```
claudedocs/
├── DATABASE_CONVENTIONS.md           # 데이터베이스 스키마 표준 규칙
├── QUICK_REFERENCE.md                # 빠른 참조 가이드
└── CHANGELOG_20260119.md            # 이 파일
```

### README 업데이트
- 프로젝트 구조에 `supabase/` 및 `claudedocs/` 추가
- row_number 컬럼 추가 필수 안내 추가

---

## 🎯 데이터베이스 표준 규칙 (중요!)

### ⚠️ 모든 테이블 필수 사항

**앞으로 모든 새 테이블을 만들 때는 `row_number` 컬럼을 반드시 포함해야 합니다!**

```sql
CREATE TABLE your_table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ✅ 필수! 모든 테이블에 포함
  row_number SERIAL NOT NULL,

  -- 비즈니스 컬럼들...

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 필수
CREATE INDEX idx_your_table_name_row_number ON your_table_name(row_number);
```

### 이유
1. **순서 추적**: Supabase Table Editor에서 데이터 삽입 순서를 1, 2, 3... 으로 명확하게 확인
2. **디버깅**: 데이터 추적 및 문제 해결이 쉬워짐
3. **UI 인덱스**: 프론트엔드에서 번호 표시에 활용 가능
4. **일관성**: 프로젝트 전체에서 동일한 패턴 사용

---

## 📚 관련 문서

새 테이블을 만들 때 참고하세요:

1. **[데이터베이스 컨벤션](./DATABASE_CONVENTIONS.md)** - 전체 표준 규칙
2. **[빠른 참조](./QUICK_REFERENCE.md)** - 간단한 가이드
3. **[테이블 템플릿](../supabase/TABLE_TEMPLATE.sql)** - 복사해서 사용할 SQL
4. **[README](../README.md)** - 프로젝트 전체 가이드

---

## ✅ 테스트 결과

### E2E 테스트 완료 ✅

1. **로그인 테스트**
   - ✅ 실제 계정으로 로그인 성공
   - ✅ 로그인 후 홈페이지로 리다이렉트

2. **링크 리스트**
   - ✅ 로그인한 사용자의 데이터만 표시
   - ✅ 각 카드 왼쪽 상단에 순번(1, 2, 3, 4) 표시
   - ✅ 스크린샷: `link-list-final.png`

3. **문서 리스트**
   - ✅ 로그인한 사용자의 키워드만 표시
   - ✅ 각 카드 왼쪽 상단에 순번(1, 2, 3) 표시
   - ✅ 스크린샷: `docs-with-index.png`

---

## 🚀 다음 단계

### Supabase에서 실행할 작업

```bash
# 1. Supabase Dashboard 접속
https://app.supabase.com

# 2. SQL Editor 열기

# 3. 마이그레이션 실행
# supabase/migrations/add_row_number_columns.sql 내용 복사 & 실행

# 4. Table Editor에서 확인
# - links 테이블 → row_number 컬럼 확인
# - keywords 테이블 → row_number 컬럼 확인
# - keyword_entries 테이블 → row_number 컬럼 확인
```

자세한 내용은 `supabase/README_row_number.md` 참고

---

## 💡 핵심 포인트

### Before (문제)
- ❌ 모든 사용자가 DEFAULT_USER_ID의 데이터를 봄
- ❌ 리스트에서 순서 파악 어려움
- ❌ Supabase 테이블에서 삽입 순서 불명확

### After (해결)
- ✅ 각 사용자는 자신의 데이터만 봄
- ✅ UI에 명확한 순번(1, 2, 3...) 표시
- ✅ DB 테이블에 영구적인 순번 컬럼 추가
- ✅ **프로젝트 표준 수립**: 모든 새 테이블에 row_number 필수

---

## 📝 체크리스트

- [x] 유저 ID 필터링 수정 (useLinksQuery, useKeywordsQuery)
- [x] UI 인덱스 표시 추가 (LinkCard, LinkList, Docs)
- [x] Supabase 마이그레이션 SQL 작성
- [x] 테이블 생성 템플릿 작성
- [x] 데이터베이스 컨벤션 문서 작성
- [x] 빠른 참조 가이드 작성
- [x] README 업데이트
- [x] E2E 테스트 완료
- [ ] Supabase에서 마이그레이션 실행 (사용자가 수동 실행)

---

**작성자**: Claude
**날짜**: 2026-01-19
**버전**: 1.0.0
