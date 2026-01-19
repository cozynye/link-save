# 데이터베이스 테이블 설계 가이드라인

## 🎯 핵심 원칙

**모든 테이블은 반드시 `row_number` 칼럼을 포함해야 합니다.**

이 프로젝트의 모든 데이터베이스 테이블은 일관된 구조를 유지하며,
사용자가 데이터를 입력 순서대로 볼 수 있도록 순번 관리를 필수로 합니다.

---

## 📋 필수 칼럼 구조

모든 테이블은 다음 칼럼들을 **반드시** 포함해야 합니다:

```sql
CREATE TABLE your_table_name (
  -- 1️⃣ Primary Key (UUID)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 2️⃣ 사용자 연관 (다중 사용자 지원)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 3️⃣ 순번 칼럼 (필수!)
  row_number SERIAL NOT NULL,

  -- 4️⃣ 비즈니스 칼럼들
  -- ... 테이블별 고유 칼럼 ...

  -- 5️⃣ 타임스탬프 (권장)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 🔢 순번(row_number) 칼럼

### 용도
- 데이터 입력 순서대로 1, 2, 3... 자동 증가
- 사용자에게 일관된 순서로 데이터 표시
- 정렬 기준으로 사용 (ORDER BY row_number)

### 특징
- **타입**: `SERIAL` (PostgreSQL의 자동 증가 정수)
- **NOT NULL**: 모든 레코드는 반드시 순번을 가짐
- **자동 할당**: INSERT 시 자동으로 다음 번호 부여
- **인덱스 필수**: 정렬 성능을 위해 인덱스 생성 필요

### 예시
```sql
-- row_number가 자동으로 1, 2, 3, 4...로 증가
INSERT INTO links (user_id, url, title) VALUES (...);  -- row_number = 1
INSERT INTO links (user_id, url, title) VALUES (...);  -- row_number = 2
INSERT INTO links (user_id, url, title) VALUES (...);  -- row_number = 3

-- 조회 시 입력 순서대로 정렬
SELECT * FROM links ORDER BY row_number;
```

---

## 📚 적용된 테이블 목록

현재 프로젝트의 모든 테이블에 `row_number`가 적용되어 있습니다:

1. **links** - 링크 저장 테이블
2. **keywords** - 키워드 저장 테이블
3. **keyword_entries** - 키워드별 엔트리 저장 테이블

---

## 🛠️ 새 테이블 생성 시 체크리스트

새로운 테이블을 만들 때는 다음을 확인하세요:

- [ ] `row_number SERIAL NOT NULL` 칼럼 포함
- [ ] `row_number`에 대한 인덱스 생성
- [ ] TypeScript 타입 정의에 `row_number: number` 추가
- [ ] 주석(COMMENT) 추가로 칼럼 목적 문서화

---

## 📝 템플릿 사용 방법

### 1. SQL 템플릿 사용
```bash
# 템플릿 파일 위치
/supabase/TABLE_TEMPLATE.sql

# 사용 방법
1. TABLE_TEMPLATE.sql 파일 복사
2. 'your_table_name'을 실제 테이블명으로 변경
3. 비즈니스 칼럼 추가
4. Supabase에서 실행
```

### 2. TypeScript 타입 정의
```typescript
// src/lib/supabase/types.ts
export interface Database {
  public: {
    Tables: {
      your_table_name: {
        Row: {
          id: string;
          user_id: string;
          row_number: number;  // 필수!
          // ... 기타 칼럼
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          row_number?: number;  // 자동 할당되므로 optional
          // ... 기타 칼럼
        };
        Update: {
          // ... 모두 optional
          row_number?: number;
        };
      };
    };
  };
}
```

---

## 🔍 인덱스 생성

순번 칼럼은 정렬에 자주 사용되므로 **반드시 인덱스를 생성**해야 합니다:

```sql
CREATE INDEX IF NOT EXISTS idx_your_table_name_row_number
  ON your_table_name(row_number);
```

---

## 📖 주석(Documentation)

칼럼의 목적을 명확히 하기 위해 주석을 추가합니다:

```sql
COMMENT ON COLUMN your_table_name.row_number IS
  'Sequential number for display order (auto-incremented)';
```

---

## ⚠️ 주의사항

### 1. row_number는 자동 증가
- 직접 값을 지정할 필요 없음
- INSERT 시 자동으로 다음 번호 할당
- 수동으로 값을 지정하면 충돌 위험

### 2. 삭제 시 번호 재사용 안 됨
- 레코드를 삭제해도 번호는 재사용되지 않음
- 예: 1, 2, 3이 있고 2를 삭제하면 → 1, 3 (2는 건너뜀)
- 다음 INSERT는 4번부터 시작

### 3. 여러 사용자 환경
- `user_id`가 다른 사용자끼리는 `row_number`가 겹칠 수 있음
- 정렬 시 `user_id`와 함께 사용: `ORDER BY user_id, row_number`

---

## 🚀 마이그레이션 실행

기존 테이블에 `row_number`를 추가하려면:

```bash
# 마이그레이션 파일 위치
/supabase/migrations/add_row_number_to_all_tables.sql

# Supabase Dashboard에서 실행:
1. Supabase Dashboard 접속
2. SQL Editor 메뉴
3. 마이그레이션 파일 내용 복사 & 실행
4. 성공 확인

# 또는 CLI 사용:
supabase db push
```

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL SERIAL 타입](https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL)
- [테이블 템플릿 파일](/supabase/TABLE_TEMPLATE.sql)
- [마이그레이션 예시](/supabase/migrations/add_row_number_to_all_tables.sql)

---

## ✅ 요약

**모든 테이블 생성 시 이것만 기억하세요:**

```sql
row_number SERIAL NOT NULL
```

**그리고 인덱스도 잊지 마세요:**

```sql
CREATE INDEX idx_테이블명_row_number ON 테이블명(row_number);
```

**TypeScript 타입 정의도:**

```typescript
row_number: number  // Row 타입
row_number?: number // Insert, Update 타입
```

이 가이드라인을 따르면 프로젝트의 모든 테이블이 일관된 구조를 유지하며,
사용자 경험도 향상됩니다! 🎉
