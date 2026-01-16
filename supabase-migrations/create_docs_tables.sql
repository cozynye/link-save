-- Docs 도메인 테이블 생성 마이그레이션

-- keywords 테이블 생성 (키워드 메타데이터)
CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, name) -- 동일 유저 내에서 키워드명 중복 방지
);

-- 코멘트 추가
COMMENT ON TABLE public.keywords IS '백과사전 키워드 목록';
COMMENT ON COLUMN public.keywords.id IS '키워드 고유 ID';
COMMENT ON COLUMN public.keywords.user_id IS '키워드를 생성한 사용자 ID';
COMMENT ON COLUMN public.keywords.name IS '키워드명 (예: 클린코드, React Query)';
COMMENT ON COLUMN public.keywords.description IS '키워드 간단 설명 (선택)';
COMMENT ON COLUMN public.keywords.tags IS '태그 배열';
COMMENT ON COLUMN public.keywords.created_at IS '생성 시각';
COMMENT ON COLUMN public.keywords.updated_at IS '수정 시각 (마지막 엔트리 추가 시 업데이트)';

-- keyword_entries 테이블 생성 (실제 마크다운 내용)
CREATE TABLE IF NOT EXISTS public.keyword_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES public.keywords(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 코멘트 추가
COMMENT ON TABLE public.keyword_entries IS '키워드에 추가된 마크다운 엔트리 (타임라인 형태)';
COMMENT ON COLUMN public.keyword_entries.id IS '엔트리 고유 ID';
COMMENT ON COLUMN public.keyword_entries.keyword_id IS '연결된 키워드 ID';
COMMENT ON COLUMN public.keyword_entries.title IS '엔트리 제목 (선택, 엔트리 구분용)';
COMMENT ON COLUMN public.keyword_entries.content IS '마크다운 원문';
COMMENT ON COLUMN public.keyword_entries.created_at IS '생성 시각';
COMMENT ON COLUMN public.keyword_entries.updated_at IS '수정 시각';

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_keywords_user_id ON public.keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_updated_at ON public.keywords(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_tags ON public.keywords USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_keywords_name ON public.keywords(name);

CREATE INDEX IF NOT EXISTS idx_keyword_entries_keyword_id ON public.keyword_entries(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_entries_updated_at ON public.keyword_entries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_entries_created_at ON public.keyword_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_entries_keyword_created ON public.keyword_entries(keyword_id, created_at DESC);

-- 트리거 설정
DROP TRIGGER IF EXISTS update_keywords_updated_at ON public.keywords;
CREATE TRIGGER update_keywords_updated_at
  BEFORE UPDATE ON public.keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_keyword_entries_updated_at ON public.keyword_entries;
CREATE TRIGGER update_keyword_entries_updated_at
  BEFORE UPDATE ON public.keyword_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 엔트리 추가/수정 시 키워드의 updated_at도 업데이트하는 함수
CREATE OR REPLACE FUNCTION public.update_keyword_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.keywords
  SET updated_at = NOW()
  WHERE id = NEW.keyword_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_keyword_on_entry_change ON public.keyword_entries;
CREATE TRIGGER update_keyword_on_entry_change
  AFTER INSERT OR UPDATE ON public.keyword_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_keyword_timestamp();

-- RLS 설정
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.keywords
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users" ON public.keywords
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.keywords
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.keywords
  FOR DELETE
  USING (true);

ALTER TABLE public.keyword_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.keyword_entries
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users" ON public.keyword_entries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.keyword_entries
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.keyword_entries
  FOR DELETE
  USING (true);
