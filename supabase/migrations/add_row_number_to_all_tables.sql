-- ============================================
-- 순번(row_number) 칼럼 추가 마이그레이션
-- ============================================
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행
-- 또는: supabase migration new add_row_number && supabase db push
-- ============================================

-- 1️⃣ links 테이블에 row_number 추가
-- ============================================
ALTER TABLE links
  ADD COLUMN IF NOT EXISTS row_number SERIAL NOT NULL;

-- 인덱스 생성 (정렬 성능 향상)
CREATE INDEX IF NOT EXISTS idx_links_row_number
  ON links(row_number);

-- 주석 추가
COMMENT ON COLUMN links.row_number IS
  'Sequential number for display order (auto-incremented)';


-- 2️⃣ keywords 테이블에 row_number 추가
-- ============================================
ALTER TABLE keywords
  ADD COLUMN IF NOT EXISTS row_number SERIAL NOT NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_keywords_row_number
  ON keywords(row_number);

-- 주석 추가
COMMENT ON COLUMN keywords.row_number IS
  'Sequential number for display order (auto-incremented)';


-- 3️⃣ keyword_entries 테이블에 row_number 추가
-- ============================================
ALTER TABLE keyword_entries
  ADD COLUMN IF NOT EXISTS row_number SERIAL NOT NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_keyword_entries_row_number
  ON keyword_entries(row_number);

-- 주석 추가
COMMENT ON COLUMN keyword_entries.row_number IS
  'Sequential number for display order (auto-incremented)';


-- ✅ 완료!
-- ============================================
-- 3개 테이블 모두에 row_number 칼럼과 인덱스가 추가되었습니다.
--
-- 확인 방법:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name IN ('links', 'keywords', 'keyword_entries')
-- AND column_name = 'row_number';
-- ============================================
