# SaveLink - 링크 저장 서비스

여러 기기에서 접근 가능한 개인용 링크 관리 서비스입니다.

## 🎯 핵심 기능

1. **링크 저장** - URL과 함께 제목, 설명 저장
2. **링크 표시** - 저장된 링크를 카드 형태로 표시
3. **필터링** - 태그별로 링크 필터링
4. **태그 관리** - 카테고리별 링크 구분 (AI, 아키텍처, 면접, CS, React 등)

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                # shadcn/ui 기본 컴포넌트
│   └── shared/            # 공유 컴포넌트
├── domains/               # 도메인 중심 구조
│   └── Link/
│       ├── components/    # Link 전용 컴포넌트
│       ├── hooks/         # Link 관련 훅
│       ├── utils/         # Link 유틸리티
│       └── types.ts       # Link 타입 정의
├── lib/
│   └── supabase/          # Supabase 설정
├── constants/             # 전역 상수
```

### 설계 원칙 (Toss Frontend Fundamentals)

- **응집도**: 도메인별 구조로 관련 코드를 한 곳에 배치
- **가독성**: 복잡한 로직 분리, 명확한 네이밍
- **예측 가능성**: 부수효과 명시, 명확한 함수 이름
- **결합도**: 단일 책임 원칙, Props Drilling 최소화

## 🚀 시작하기

### 1. 환경 변수 설정

`.env.local.example`을 복사하여 `.env.local` 파일을 생성하세요:

```bash
cp .env.local.example .env.local
```

Supabase 프로젝트에서 URL과 Anon Key를 가져와 `.env.local`에 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase 테이블 생성

Supabase SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- links 테이블 생성
create table if not exists public.links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  description text,
  thumbnail_url text,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) 활성화
alter table public.links enable row level security;

-- 정책: 사용자는 자신의 링크만 조회 가능
create policy "Users can view their own links"
  on public.links for select
  using (auth.uid() = user_id);

-- 정책: 사용자는 자신의 링크만 생성 가능
create policy "Users can create their own links"
  on public.links for insert
  with check (auth.uid() = user_id);

-- 정책: 사용자는 자신의 링크만 수정 가능
create policy "Users can update their own links"
  on public.links for update
  using (auth.uid() = user_id);

-- 정책: 사용자는 자신의 링크만 삭제 가능
create policy "Users can delete their own links"
  on public.links for delete
  using (auth.uid() = user_id);

-- 인덱스 생성 (성능 최적화)
create index if not exists links_user_id_idx on public.links(user_id);
create index if not exists links_created_at_idx on public.links(created_at desc);
create index if not exists links_tags_idx on public.links using gin(tags);
```

### 3. 패키지 설치 및 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📦 사용된 shadcn/ui 컴포넌트

- `button` - 저장, 삭제 버튼
- `card` - 링크 아이템 표시
- `input` - URL 입력
- `badge` - 태그 표시
- `dialog` - 링크 추가/수정 모달
- `textarea` - 설명 입력
- `label` - 폼 레이블

## 🔜 개발 로드맵

### Phase 1: 기본 기능 (현재)
- [ ] 링크 추가 폼 구현
- [ ] 링크 목록 표시
- [ ] 태그 선택 기능
- [ ] Supabase 연동

### Phase 2: 필터링 & 검색
- [ ] 태그별 필터링
- [ ] 검색 기능
- [ ] 정렬 기능 (최신순, 오래된순)

### Phase 3: 고급 기능
- [ ] 링크 메타데이터 자동 추출
- [ ] 썸네일 이미지 표시
- [ ] 즐겨찾기 기능
- [ ] 링크 내보내기 (JSON, CSV)

## 📝 라이선스

MIT
