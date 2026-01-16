# Supabase 데이터베이스 설정

이 파일의 SQL 쿼리들을 Supabase SQL Editor에서 순서대로 실행하세요.

## 1. links 테이블 생성

```sql
-- links 테이블 생성
CREATE TABLE IF NOT EXISTS public.links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 코멘트 추가
COMMENT ON TABLE public.links IS '사용자가 저장한 링크 정보';
COMMENT ON COLUMN public.links.id IS '링크 고유 ID';
COMMENT ON COLUMN public.links.user_id IS '링크를 저장한 사용자 ID';
COMMENT ON COLUMN public.links.url IS '저장된 URL';
COMMENT ON COLUMN public.links.title IS '링크 제목';
COMMENT ON COLUMN public.links.description IS '링크 설명 (선택)';
COMMENT ON COLUMN public.links.thumbnail_url IS '썸네일 이미지 URL (선택)';
COMMENT ON COLUMN public.links.tags IS '태그 배열';
COMMENT ON COLUMN public.links.created_at IS '생성 시각';
COMMENT ON COLUMN public.links.updated_at IS '수정 시각';
```

## 2. 인덱스 생성 (성능 최적화)

```sql
-- user_id로 필터링할 때 사용
CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links(user_id);

-- 생성일자로 정렬할 때 사용
CREATE INDEX IF NOT EXISTS idx_links_created_at ON public.links(created_at DESC);

-- 태그 검색 시 사용 (GIN 인덱스)
CREATE INDEX IF NOT EXISTS idx_links_tags ON public.links USING GIN(tags);

-- user_id와 created_at 복합 인덱스 (가장 자주 사용되는 쿼리 패턴)
CREATE INDEX IF NOT EXISTS idx_links_user_created ON public.links(user_id, created_at DESC);
```

## 3. updated_at 자동 업데이트 트리거

```sql
-- updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- links 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_links_updated_at ON public.links;
CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

## 4. Row Level Security (RLS) 설정

```sql
-- RLS 활성화
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (접근 키는 애플리케이션 레벨에서 처리)
CREATE POLICY "Enable read access for all users" ON public.links
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입 가능 (접근 키는 애플리케이션 레벨에서 처리)
CREATE POLICY "Enable insert access for all users" ON public.links
  FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 업데이트 가능 (접근 키는 애플리케이션 레벨에서 처리)
CREATE POLICY "Enable update access for all users" ON public.links
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 모든 사용자가 삭제 가능 (접근 키는 애플리케이션 레벨에서 처리)
CREATE POLICY "Enable delete access for all users" ON public.links
  FOR DELETE
  USING (true);
```

## 5. 테스트 데이터 삽입 (선택 사항)

```sql
-- 테스트용 샘플 데이터
INSERT INTO public.links (user_id, url, title, description, tags)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'https://react.dev',
    'React 공식 문서',
    'React의 새로운 공식 문서',
    ARRAY['React', '레퍼런스']
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'https://nextjs.org/docs',
    'Next.js Documentation',
    'Next.js 14 공식 문서',
    ARRAY['Next.js', 'React', '레퍼런스']
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'https://supabase.com/docs',
    'Supabase 문서',
    'Supabase 공식 가이드',
    ARRAY['데이터베이스', '레퍼런스']
  );
```

## 6. 고정 기능 추가 (is_pinned 컬럼)

```sql
-- is_pinned 컬럼 추가
ALTER TABLE public.links
ADD COLUMN is_pinned BOOLEAN DEFAULT false NOT NULL;

-- 고정 상태로 빠른 필터링을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_links_is_pinned ON public.links(is_pinned);

-- 코멘트 추가
COMMENT ON COLUMN public.links.is_pinned IS '링크가 목록 최상단에 고정되었는지 여부';
```

## 7. 설정 확인 쿼리

```sql
-- 테이블 구조 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'links'
ORDER BY ordinal_position;

-- 인덱스 확인
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'links';

-- 데이터 확인
SELECT * FROM public.links ORDER BY created_at DESC LIMIT 10;
```

## 8. Docs 도메인 - keywords 테이블 생성

```sql
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
```

## 9. Docs 도메인 - keyword_entries 테이블 생성

```sql
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
```

## 10. Docs 도메인 - 인덱스 생성

```sql
-- keywords 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_keywords_user_id ON public.keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_updated_at ON public.keywords(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_tags ON public.keywords USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_keywords_name ON public.keywords(name);

-- keyword_entries 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_keyword_entries_keyword_id ON public.keyword_entries(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_entries_updated_at ON public.keyword_entries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_entries_created_at ON public.keyword_entries(created_at DESC);

-- 복합 인덱스 (타임라인 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_keyword_entries_keyword_created
  ON public.keyword_entries(keyword_id, created_at DESC);
```

## 11. Docs 도메인 - updated_at 트리거 설정

```sql
-- keywords 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_keywords_updated_at ON public.keywords;
CREATE TRIGGER update_keywords_updated_at
  BEFORE UPDATE ON public.keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- keyword_entries 테이블에 트리거 적용
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

-- 엔트리 생성/수정 시 키워드 타임스탬프 업데이트 트리거
DROP TRIGGER IF EXISTS update_keyword_on_entry_change ON public.keyword_entries;
CREATE TRIGGER update_keyword_on_entry_change
  AFTER INSERT OR UPDATE ON public.keyword_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_keyword_timestamp();
```

## 12. Docs 도메인 - RLS 설정

```sql
-- keywords 테이블 RLS 활성화
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

-- keyword_entries 테이블 RLS 활성화
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
```

## 13. Docs 도메인 - 테스트 데이터 (선택 사항)

```sql
-- 테스트용 샘플 키워드 및 엔트리
INSERT INTO public.keywords (user_id, name, description, tags)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '클린코드',
    '읽기 좋은 코드 작성 원칙',
    ARRAY['개발', '베스트프랙티스']
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'React Query',
    '서버 상태 관리 라이브러리',
    ARRAY['React', '라이브러리']
  );

-- 샘플 엔트리 추가
INSERT INTO public.keyword_entries (keyword_id, title, content)
SELECT
  id,
  '기본 개념',
  '# 클린코드란?

클린코드는 **읽기 쉽고 이해하기 쉬운 코드**를 의미합니다.

## 주요 원칙
- 의미 있는 이름 사용
- 함수는 한 가지 일만
- 주석보다는 코드로 설명'
FROM public.keywords WHERE name = '클린코드'
LIMIT 1;
```

## 완료!

모든 쿼리를 실행한 후:

### Links 도메인
1. ✅ links 테이블이 생성되었습니다
2. ✅ 성능 최적화를 위한 인덱스가 설정되었습니다
3. ✅ updated_at이 자동으로 업데이트됩니다
4. ✅ RLS 정책이 설정되었습니다 (보안은 애플리케이션 레벨 접근 키로 처리)

### Docs 도메인
1. ✅ keywords, keyword_entries 테이블이 생성되었습니다
2. ✅ 타임라인 조회를 위한 인덱스가 설정되었습니다
3. ✅ 엔트리 추가 시 키워드의 updated_at이 자동 업데이트됩니다
4. ✅ RLS 정책이 설정되었습니다

이제 애플리케이션에서 링크 저장 및 백과사전 기능을 사용할 수 있습니다!
