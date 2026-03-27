/**
 * Centralized Korean UI selectors for SaveLink E2E tests
 */

// Header
export const HEADER_TITLE = '기억';
export const NAV_LINK = 'Link';
export const NAV_DOCS = 'Docs';
export const LOGOUT_BUTTON = '로그아웃';

// Login
export const LOGIN_HEADING = '로그인';
export const LOGIN_SUBMIT = '로그인';
export const LOGIN_LOADING = '로그인 중...';
export const LOGIN_ERROR_EMPTY = '이메일과 비밀번호를 입력해주세요.';
export const LOGIN_ERROR_INVALID = '이메일 또는 비밀번호가 올바르지 않습니다';

// Link Form
export const LINK_ADD_BUTTON = '링크 추가';
export const LINK_FORM_TITLE_NEW = '새 링크 추가';
export const LINK_FORM_TITLE_EDIT = '링크 수정';
export const LINK_SAVE = '저장';
export const LINK_SAVING = '저장 중...';
export const LINK_EDIT_SAVE = '수정';
export const LINK_CANCEL = '취소';
export const LINK_AUTO_FILL = '자동 입력';
export const LINK_AUTO_FILL_LOADING = '가져오는 중...';

// Link Validation
export const LINK_ERROR_URL_REQUIRED = 'URL을 입력해주세요';
export const LINK_ERROR_URL_INVALID = '올바른 URL 형식이 아닙니다';

// Link Card Actions
export const LINK_EDIT = '수정';
export const LINK_DELETE = '삭제';
export const LINK_PIN = '고정';
export const LINK_UNPIN = '해제';

// Link Delete Dialog
export const LINK_DELETE_TITLE = '링크 삭제';

// Link Filter
export const LINK_SEARCH_PLACEHOLDER = '제목 또는 URL로 검색...';
export const LINK_TAG_ALL = '전체';

// Docs
export const DOCS_NEW_ENTRY = '새 엔트리';
export const DOCS_FIRST_ENTRY = '첫 엔트리 작성하기';
export const DOCS_NO_KEYWORDS = '아직 키워드가 없습니다';
export const DOCS_NO_SEARCH_RESULTS = '검색 결과가 없습니다';
export const DOCS_SEARCH_PLACEHOLDER = '키워드 검색...';

// Docs Entry Form
export const DOCS_SAVE = '저장';
export const DOCS_EDIT_SAVE = '수정';
export const DOCS_CANCEL = '취소';
export const DOCS_CONTENT_ERROR = '내용을 입력해주세요';
export const DOCS_KEYWORD_ERROR = '키워드를 입력해주세요';
export const DOCS_PREVIEW_EMPTY = '내용을 입력하면 미리보기가 표시됩니다';

// Docs Entry Delete
export const ENTRY_DELETE_TITLE = '엔트리 삭제';

// Common
export const LOADING = '로딩 중...';

/**
 * Generate unique test identifier
 */
export function testId(prefix: string): string {
  return `[TEST-${Date.now()}] ${prefix}`;
}
