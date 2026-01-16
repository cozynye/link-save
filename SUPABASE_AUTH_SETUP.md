# Supabase Auth 설정 가이드

## 개요
이 애플리케이션은 Supabase의 내장 Auth 기능을 사용하여 이메일/비밀번호 기반 인증을 제공합니다.

## 초기 사용자 생성 방법

### 방법 1: Supabase Dashboard 사용 (권장)

1. Supabase 프로젝트 대시보드 접속
   - URL: https://supabase.com/dashboard/project/romdbxfaajchfmuotkjw

2. Authentication 메뉴로 이동
   - 왼쪽 사이드바에서 "Authentication" 클릭
   - "Users" 탭 선택

3. "Add user" 버튼 클릭
   - "Create a new user" 선택

4. 사용자 정보 입력
   - **Email**: 로그인에 사용할 이메일 주소
   - **Password**: 안전한 비밀번호 (최소 6자)
   - "Auto Confirm User" 체크 (이메일 인증 없이 즉시 사용)

5. "Create user" 클릭

### 방법 2: SQL Editor 사용

Supabase Dashboard > SQL Editor에서 다음 쿼리 실행:

```sql
-- 사용자 생성 (Supabase Auth 함수 사용)
SELECT auth.users();  -- 기존 사용자 확인

-- 새 사용자는 Dashboard에서 생성하는 것이 더 안전합니다
```

## 로그인 방법

1. 애플리케이션 접속
   - 메인 페이지 (`/`) 방문

2. 보호된 페이지 접근
   - `/link` 또는 `/docs` 페이지 클릭
   - 자동으로 로그인 페이지로 리다이렉트됨

3. 로그인 정보 입력
   - **이메일**: Dashboard에서 생성한 이메일
   - **비밀번호**: 설정한 비밀번호

4. 로그인 후 자동으로 원래 페이지로 이동

## 세션 관리

- **세션 지속 시간**: 로그인 상태는 브라우저를 닫아도 유지됩니다
- **자동 로그아웃**: Supabase가 자동으로 관리 (기본 1시간 액세스 토큰, 7일 리프레시 토큰)
- **수동 로그아웃**: 헤더의 "로그아웃" 버튼 클릭

## 보안 고려사항

### 현재 구현
- ✅ Supabase Auth 내장 사용 (안전한 JWT 토큰 기반)
- ✅ 비밀번호 bcrypt 해싱 (Supabase 자동 처리)
- ✅ HTTPS 필수 (프로덕션)
- ✅ RLS(Row Level Security) 활성화 가능

### 추가 설정 (선택사항)

#### 1. RLS 정책 추가
현재는 모든 인증된 사용자가 데이터에 접근 가능합니다. 더 엄격한 접근 제어가 필요한 경우:

```sql
-- links 테이블 RLS 정책
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own links"
  ON links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own links"
  ON links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own links"
  ON links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own links"
  ON links FOR DELETE
  USING (auth.uid() = user_id);

-- keywords, keyword_entries에도 동일하게 적용
```

#### 2. 이메일 인증 활성화
Supabase Dashboard > Authentication > Email Auth에서:
- "Enable email confirmations" 활성화
- 이메일 템플릿 커스터마이징

#### 3. 비밀번호 정책 설정
Supabase Dashboard > Authentication > Policies에서:
- 최소 길이 설정
- 복잡도 요구사항 설정

## 문제 해결

### 로그인이 안 될 때
1. Supabase Dashboard에서 사용자가 생성되었는지 확인
2. 사용자의 "Email Confirmed" 상태 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 세션이 유지되지 않을 때
1. 브라우저 쿠키가 활성화되어 있는지 확인
2. localStorage가 차단되지 않았는지 확인 (Supabase Auth가 localStorage 사용)

### 개발 환경에서 CORS 에러
- Supabase Dashboard > Settings > API에서 허용된 도메인 확인
- `localhost:3000` 또는 개발 서버 URL이 허용 목록에 있는지 확인

## 다음 단계

로그인 시스템이 정상 작동하면:
1. `/link` 페이지에서 링크 추가/수정/삭제 테스트
2. `/docs` 페이지에서 문서 작성/편집 테스트
3. 로그아웃 후 보호된 페이지 접근 시 리다이렉트 확인
4. 필요시 RLS 정책 추가하여 보안 강화

## 참고 자료

- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Email Auth 설정](https://supabase.com/docs/guides/auth/auth-email)
