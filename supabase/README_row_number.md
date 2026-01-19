# Supabase 테이블에 순번(row_number) 컬럼 추가하기

## 📝 목적
Supabase 테이블에서 데이터 삽입 순서를 1, 2, 3, 4, 5... 형태로 쉽게 확인할 수 있도록 순번 컬럼을 추가합니다.

## 🚀 실행 방법

### 1단계: Supabase Dashboard에서 SQL 실행

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 `SQL Editor` 클릭
   - `New query` 버튼 클릭

3. **SQL 쿼리 복사 & 실행**
   - `migrations/add_row_number_columns.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - `Run` 버튼 클릭 또는 `Cmd/Ctrl + Enter`

### 2단계: 테이블 확인

1. **Table Editor 열기**
   - 왼쪽 메뉴에서 `Table Editor` 클릭

2. **links 테이블 확인**
   - `links` 테이블 선택
   - 새로운 `row_number` 컬럼 확인
   - 기존 데이터에 자동으로 순번이 할당되어 있음 (1, 2, 3...)

3. **keywords 테이블 확인**
   - `keywords` 테이블 선택
   - `row_number` 컬럼으로 정렬하면 삽입 순서 확인 가능

4. **keyword_entries 테이블 확인**
   - `keyword_entries` 테이블 선택
   - 마찬가지로 `row_number` 컬럼 확인

## 📊 row_number 컬럼 특징

- **자동 증가**: 새로운 데이터 삽입 시 자동으로 다음 번호 할당 (SERIAL 타입)
- **기존 데이터**: 이미 있는 데이터에도 자동으로 순번 부여
- **인덱스**: 빠른 정렬을 위한 인덱스 자동 생성
- **삭제 시**: 데이터 삭제해도 번호는 재사용되지 않음 (일관성 유지)

## 🔍 사용 예시

### Supabase Table Editor에서
```
row_number | user_id | title | created_at
-----------+---------+-------+------------
1          | abc...  | 첫 번째 링크 | 2024-01-01
2          | abc...  | 두 번째 링크 | 2024-01-02
3          | abc...  | 세 번째 링크 | 2024-01-03
```

### SQL 쿼리로 확인
```sql
-- row_number 순서로 조회
SELECT row_number, title, created_at
FROM links
ORDER BY row_number ASC;

-- 최근 추가된 항목 확인
SELECT row_number, title, created_at
FROM links
ORDER BY row_number DESC
LIMIT 10;
```

## 🔄 타입 정의 업데이트 (선택사항)

만약 TypeScript 타입 자동 완성이 필요하다면:

```bash
# Supabase CLI가 설치되어 있다면
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

또는 Supabase Dashboard → Settings → API → Project URL 및 anon key 확인 후:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/lib/supabase/types.ts
```

## ✅ 완료 확인

- [ ] SQL 쿼리 실행 완료
- [ ] links 테이블에 row_number 컬럼 생성 확인
- [ ] keywords 테이블에 row_number 컬럼 생성 확인
- [ ] keyword_entries 테이블에 row_number 컬럼 생성 확인
- [ ] 기존 데이터에 순번 자동 할당 확인
- [ ] 새 데이터 추가 시 순번 자동 증가 확인

## 💡 참고사항

- `row_number`는 삽입 순서를 나타내며, 삭제된 항목의 번호는 재사용되지 않습니다
- `created_at`과 다르게 명확한 정수 순서를 제공합니다
- UI에 표시되는 인덱스(1, 2, 3...)와는 별개로, DB 레벨에서 영구적인 순번을 관리합니다
