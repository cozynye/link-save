/**
 * 애플리케이션 전역 설정
 */
export const APP_CONFIG = {
  name: 'SaveLink',
  description: '링크를 저장하고 관리하는 서비스',
  maxTagsPerLink: 5,
  maxTitleLength: 200,
  maxDescriptionLength: 500,
  defaultSortBy: 'created_at' as const,
  defaultSortOrder: 'desc' as const,
} as const;

/**
 * 기본 사용자 ID (단일 사용자 애플리케이션)
 */
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';
