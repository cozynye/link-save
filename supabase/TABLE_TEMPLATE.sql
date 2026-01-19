-- ============================================
-- 테이블 생성 템플릿
-- ============================================
-- 이 템플릿을 복사해서 새 테이블을 만드세요.
-- 모든 테이블은 row_number 컬럼을 포함해야 합니다.
-- ============================================

-- 1️⃣ 테이블 생성
-- ============================================
CREATE TABLE your_table_name (
  -- Primary Key (UUID)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 연관 (다중 사용자 지원 시 필수)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 🔢 순번 컬럼 (필수! - 모든 테이블에 포함)
  row_number SERIAL NOT NULL,

  -- ========================================
  -- 비즈니스 컬럼들 (여기에 필요한 컬럼 추가)
  -- ========================================
  name TEXT NOT NULL,
  description TEXT,
  -- 필요한 다른 컬럼들 추가...

  -- 타임스탬프 (권장)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2️⃣ 인덱스 생성
-- ============================================
-- 사용자별 조회 성능 향상
CREATE INDEX idx_your_table_name_user_id
  ON your_table_name(user_id);

-- 순번 정렬 성능 향상 (필수!)
CREATE INDEX idx_your_table_name_row_number
  ON your_table_name(row_number);

-- 생성일 정렬 성능 향상 (선택)
CREATE INDEX idx_your_table_name_created_at
  ON your_table_name(created_at);

-- 기타 필요한 인덱스 추가...

-- 3️⃣ RLS (Row Level Security) 설정
-- ============================================
-- RLS 활성화
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

-- 조회 정책
CREATE POLICY "Users can view their own data"
  ON your_table_name FOR SELECT
  USING (auth.uid() = user_id);

-- 삽입 정책
CREATE POLICY "Users can insert their own data"
  ON your_table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 수정 정책
CREATE POLICY "Users can update their own data"
  ON your_table_name FOR UPDATE
  USING (auth.uid() = user_id);

-- 삭제 정책
CREATE POLICY "Users can delete their own data"
  ON your_table_name FOR DELETE
  USING (auth.uid() = user_id);

-- 4️⃣ 주석 추가 (문서화)
-- ============================================
-- 테이블 설명
COMMENT ON TABLE your_table_name IS
  'Description of what this table stores';

-- 컬럼 설명
COMMENT ON COLUMN your_table_name.id IS
  'Unique identifier for the record';

COMMENT ON COLUMN your_table_name.user_id IS
  'Reference to the user who owns this record';

COMMENT ON COLUMN your_table_name.row_number IS
  'Sequential number for display order (auto-incremented)';

COMMENT ON COLUMN your_table_name.name IS
  'Name or title of the record';

COMMENT ON COLUMN your_table_name.created_at IS
  'Timestamp when the record was created';

COMMENT ON COLUMN your_table_name.updated_at IS
  'Timestamp when the record was last updated';

-- 5️⃣ Trigger for updated_at (선택사항)
-- ============================================
-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 생성
CREATE TRIGGER update_your_table_name_updated_at
  BEFORE UPDATE ON your_table_name
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ✅ 체크리스트
-- ============================================
-- [ ] 테이블명을 실제 이름으로 변경했나요?
-- [ ] row_number SERIAL 컬럼이 포함되어 있나요? (필수!)
-- [ ] 비즈니스 컬럼들을 추가했나요?
-- [ ] 모든 인덱스를 생성했나요?
-- [ ] RLS가 활성화되어 있나요?
-- [ ] RLS 정책이 모두 생성되었나요?
-- [ ] 주석이 추가되어 있나요?
-- [ ] updated_at 트리거가 필요한가요? (선택사항)
-- ============================================


-- ============================================
-- 📋 예시: tags 테이블
-- ============================================
/*
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  row_number SERIAL NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_row_number ON tags(row_number);
CREATE INDEX idx_tags_name ON tags(name);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE tags IS 'User-defined tags for organizing content';
COMMENT ON COLUMN tags.row_number IS 'Sequential number for display order (auto-incremented)';
*/
