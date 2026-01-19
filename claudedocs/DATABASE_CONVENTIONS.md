# 데이터베이스 스키마 컨벤션

## 📋 테이블 생성 표준 규칙

모든 Supabase 테이블 생성 시 아래 규칙을 **반드시** 따라야 합니다.

---

## 🔢 필수 컬럼: row_number

**모든 테이블**에는 데이터 삽입 순서를 추적하기 위한 `row_number` 컬럼이 **필수**입니다.

### 이유
- Supabase Table Editor에서 데이터 삽입 순서를 명확하게 확인 (1, 2, 3, 4...)
- UI에서 인덱스 표시에 활용 가능
- 디버깅 및 데이터 추적 용이

### 타입
```sql
row_number SERIAL NOT NULL
```

### 특징
- **자동 증가**: 새 데이터 삽입 시 자동으로 다음 번호 할당
- **영구적**: 데이터 삭제해도 번호는 재사용되지 않음 (일관성 유지)
- **인덱스**: 성능을 위해 인덱스 자동 생성 권장

---

## 📐 테이블 생성 템플릿

### 기본 템플릿

```sql
-- 테이블 생성
CREATE TABLE table_name (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 연관 (필요한 경우)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 순번 컬럼 (필수)
  row_number SERIAL NOT NULL,

  -- 비즈니스 컬럼들
  name TEXT NOT NULL,
  description TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_table_name_user_id ON table_name(user_id);
CREATE INDEX idx_table_name_row_number ON table_name(row_number);
CREATE INDEX idx_table_name_created_at ON table_name(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view their own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);

-- 컬럼 주석
COMMENT ON COLUMN table_name.row_number IS 'Sequential number for display order (auto-incremented)';
COMMENT ON TABLE table_name IS 'Description of what this table stores';
```

---

## 📊 현재 프로젝트 테이블 현황

### ✅ 적용 완료된 테이블

| 테이블 | row_number 컬럼 | 마이그레이션 |
|--------|----------------|--------------|
| `links` | ✅ | `supabase/migrations/add_row_number_columns.sql` |
| `keywords` | ✅ | `supabase/migrations/add_row_number_columns.sql` |
| `keyword_entries` | ✅ | `supabase/migrations/add_row_number_columns.sql` |

### 마이그레이션 실행 방법

1. **Supabase Dashboard 접속**
   ```
   https://app.supabase.com
   ```

2. **SQL Editor에서 실행**
   - `supabase/migrations/add_row_number_columns.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - Run 버튼 클릭

3. **확인**
   - Table Editor에서 각 테이블의 `row_number` 컬럼 확인
   - 기존 데이터에 자동으로 1, 2, 3... 순번이 할당되어 있는지 확인

---

## 🔧 새 테이블 생성 체크리스트

새로운 테이블을 만들 때는 아래 체크리스트를 확인하세요:

- [ ] `id UUID PRIMARY KEY` 컬럼 추가
- [ ] `user_id UUID` 컬럼 추가 (사용자별 데이터인 경우)
- [ ] **`row_number SERIAL`** 컬럼 추가 (필수!)
- [ ] `created_at TIMESTAMPTZ` 컬럼 추가
- [ ] `updated_at TIMESTAMPTZ` 컬럼 추가
- [ ] `row_number`에 인덱스 생성
- [ ] `user_id`에 인덱스 생성 (해당되는 경우)
- [ ] RLS 활성화
- [ ] RLS 정책 생성 (SELECT, INSERT, UPDATE, DELETE)
- [ ] 컬럼에 주석 추가 (`COMMENT ON COLUMN`)
- [ ] 테이블에 주석 추가 (`COMMENT ON TABLE`)

---

## 💡 row_number 활용 예시

### SQL 쿼리에서 사용
```sql
-- 삽입 순서대로 조회
SELECT * FROM links
ORDER BY row_number ASC;

-- 최근 추가된 10개 항목
SELECT * FROM links
ORDER BY row_number DESC
LIMIT 10;

-- 특정 범위 조회
SELECT * FROM links
WHERE row_number BETWEEN 1 AND 100
ORDER BY row_number;
```

### TypeScript/React에서 사용
```typescript
// Supabase 쿼리
const { data: links } = await supabase
  .from('links')
  .select('*')
  .order('row_number', { ascending: true });

// UI에서 인덱스 표시
{links.map((link, index) => (
  <LinkCard
    key={link.id}
    link={link}
    index={link.row_number} // DB의 영구적 순번 사용
  />
))}
```

---

## 🚨 주의사항

### ❌ 하지 말아야 할 것

1. **row_number를 Primary Key로 사용하지 마세요**
   - UUID `id`가 Primary Key입니다
   - `row_number`는 정렬/표시용입니다

2. **row_number를 수동으로 수정하지 마세요**
   - SERIAL 타입이 자동으로 관리합니다
   - 수동 수정 시 일관성이 깨질 수 있습니다

3. **row_number에 UNIQUE 제약을 걸지 마세요**
   - 자동 증가로 자연스럽게 고유성이 보장됩니다

### ✅ 해야 할 것

1. **모든 새 테이블에 row_number 추가**
2. **row_number에 인덱스 생성**
3. **컬럼에 명확한 주석 추가**

---

## 📚 참고 자료

- Supabase 공식 문서: https://supabase.com/docs
- PostgreSQL SERIAL 타입: https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL
- 프로젝트 마이그레이션: `supabase/migrations/`
- 마이그레이션 가이드: `supabase/README_row_number.md`

---

## 🔄 업데이트 히스토리

| 날짜 | 변경 내용 | 작성자 |
|------|-----------|--------|
| 2026-01-19 | 초안 작성 - row_number 컬럼 표준화 | Claude |
| 2026-01-19 | links, keywords, keyword_entries 테이블에 적용 | Claude |

---

**중요**: 이 문서는 프로젝트의 데이터베이스 표준입니다. 모든 개발자는 테이블 생성 시 이 가이드를 따라야 합니다.
