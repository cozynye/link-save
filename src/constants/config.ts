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
