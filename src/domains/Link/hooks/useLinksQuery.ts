'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/auth';
import type { Link, LinkFilterOptions } from '../types';

// 링크 조회 함수
async function fetchLinks(filterOptions?: LinkFilterOptions): Promise<Link[]> {
  // 현재 로그인한 사용자 ID 가져오기
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('로그인이 필요합니다');
  }

  let query = supabase
    .from('links')
    .select('*')
    .eq('user_id', userId);

  // 태그 필터링
  if (filterOptions?.tags && filterOptions.tags.length > 0) {
    query = query.overlaps('tags', filterOptions.tags);
  }

  // 검색어 필터링 (제목 또는 URL에서 검색)
  if (filterOptions?.searchQuery) {
    query = query.or(
      `title.ilike.%${filterOptions.searchQuery}%,url.ilike.%${filterOptions.searchQuery}%`
    );
  }

  // 정렬 - 고정된 항목을 먼저 표시하고, 그 다음에 사용자가 선택한 정렬 적용
  const sortBy = filterOptions?.sortBy || 'updated_at';
  const sortOrder = filterOptions?.sortOrder || 'desc';

  // 1. is_pinned로 먼저 정렬 (고정된 항목이 먼저 오도록)
  query = query.order('is_pinned', { ascending: false });

  // 2. 사용자가 선택한 정렬 기준 적용
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

// Query Key 생성 함수
export function getLinksQueryKey(filterOptions?: LinkFilterOptions) {
  return ['links', filterOptions] as const;
}

// useLinksQuery 훅
export function useLinksQuery(filterOptions?: LinkFilterOptions) {
  return useQuery({
    queryKey: getLinksQueryKey(filterOptions),
    queryFn: () => fetchLinks(filterOptions),
    staleTime: 30 * 1000, // 30초
  });
}
