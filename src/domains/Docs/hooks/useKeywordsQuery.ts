import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/auth';
import type { DocsFilterOptions, KeywordWithCount } from '../types';

async function fetchKeywords(
  filterOptions: DocsFilterOptions = {}
): Promise<KeywordWithCount[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('로그인이 필요합니다');
  }

  let query = supabase
    .from('keywords')
    .select('*, keyword_entries(count)')
    .eq('user_id', userId);

  // 검색어 필터
  if (filterOptions.searchKeyword) {
    query = query.ilike('name', `%${filterOptions.searchKeyword}%`);
  }

  // 태그 필터
  if (filterOptions.tags && filterOptions.tags.length > 0) {
    query = query.contains('tags', filterOptions.tags);
  }

  // 정렬
  const sortBy = filterOptions.sortBy || 'updated_at';
  const sortOrder = filterOptions.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Supabase 관계 쿼리 결과에서 entry_count 추출
  const keywordsWithCount: KeywordWithCount[] = (data || []).map((keyword: Record<string, unknown>) => {
    const entries = keyword.keyword_entries as { count: number }[] | undefined;
    const entryCount = entries?.[0]?.count ?? 0;
    const { keyword_entries: _, ...rest } = keyword;
    return {
      ...rest,
      entry_count: entryCount,
    } as KeywordWithCount;
  });

  return keywordsWithCount;
}

export function useKeywordsQuery(filterOptions: DocsFilterOptions = {}) {
  return useQuery({
    queryKey: ['keywords', filterOptions],
    queryFn: () => fetchKeywords(filterOptions),
  });
}
