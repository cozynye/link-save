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

## 완료!

모든 쿼리를 실행한 후:
1. ✅ links 테이블이 생성되었습니다
2. ✅ 성능 최적화를 위한 인덱스가 설정되었습니다
3. ✅ updated_at이 자동으로 업데이트됩니다
4. ✅ RLS 정책이 설정되었습니다 (보안은 애플리케이션 레벨 접근 키로 처리)

이제 애플리케이션에서 Supabase와 연결하여 링크를 저장하고 조회할 수 있습니다!
