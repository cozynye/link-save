# 빠른 참조 가이드 (Quick Reference)

## 🔢 새 테이블 생성 시 필수 사항

```sql
-- ⚠️ 모든 테이블에 반드시 포함해야 하는 컬럼
row_number SERIAL NOT NULL
```

### 왜?
- Supabase Table Editor에서 데이터 순서를 쉽게 확인 (1, 2, 3...)
- UI에서 인덱스 표시 가능
- 디버깅 및 데이터 추적 용이

---

## 📂 파일 위치

| 파일 | 설명 | 경로 |
|------|------|------|
| **전체 컨벤션 문서** | 상세한 표준 및 규칙 | `claudedocs/DATABASE_CONVENTIONS.md` |
| **테이블 생성 템플릿** | 복사해서 사용할 SQL | `supabase/TABLE_TEMPLATE.sql` |
| **row_number 마이그레이션** | 기존 테이블 업데이트 | `supabase/migrations/add_row_number_columns.sql` |
| **마이그레이션 가이드** | 실행 방법 설명 | `supabase/README_row_number.md` |

---

## ⚡ 빠른 시작

### 1. 새 테이블 만들기

```bash
# 1. 템플릿 복사
cat supabase/TABLE_TEMPLATE.sql

# 2. Supabase Dashboard → SQL Editor
# 3. 템플릿 내용 붙여넣고 테이블명/컬럼 수정
# 4. Run 실행
```

### 2. 기존 테이블에 row_number 추가

```bash
# 1. 마이그레이션 파일 확인
cat supabase/migrations/add_row_number_columns.sql

# 2. Supabase Dashboard → SQL Editor
# 3. SQL 실행
```

---

## ✅ 체크리스트

새 테이블 만들 때:

```
□ id UUID PRIMARY KEY ✓
□ user_id UUID (필요 시) ✓
□ row_number SERIAL ✓ ← 필수!
□ created_at TIMESTAMPTZ ✓
□ updated_at TIMESTAMPTZ ✓
□ 인덱스 생성 (row_number 포함) ✓
□ RLS 활성화 ✓
□ RLS 정책 생성 ✓
□ 주석 추가 ✓
```

---

## 📊 현재 프로젝트 테이블

| 테이블 | row_number | 상태 |
|--------|------------|------|
| `links` | ✅ | 완료 |
| `keywords` | ✅ | 완료 |
| `keyword_entries` | ✅ | 완료 |

---

## 🔗 관련 링크

- [전체 컨벤션 문서](./DATABASE_CONVENTIONS.md)
- [테이블 템플릿](../supabase/TABLE_TEMPLATE.sql)
- [Supabase 공식 문서](https://supabase.com/docs)

---

## 💡 자주 묻는 질문

**Q: row_number는 왜 SERIAL이고 UUID가 아닌가요?**
- A: 순번은 순서를 나타내는 정수이므로 SERIAL이 적합합니다. UUID는 Primary Key인 `id`가 담당합니다.

**Q: 기존 데이터에도 자동으로 번호가 붙나요?**
- A: 네! SERIAL 타입은 기존 데이터에도 1, 2, 3... 순번을 자동 할당합니다.

**Q: row_number를 Primary Key로 써도 되나요?**
- A: 안 됩니다. `id UUID`가 Primary Key이고, `row_number`는 정렬/표시용입니다.

**Q: 데이터를 삭제하면 번호가 재사용되나요?**
- A: 아니요. 삭제해도 번호는 재사용되지 않습니다. 이것이 일관성을 유지하는 방법입니다.

---

**중요**: 모든 새 테이블은 `row_number SERIAL` 컬럼을 포함해야 합니다!
