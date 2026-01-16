import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { DEFAULT_USER_ID } from '@/constants/config';
import type { DocsFilterOptions, KeywordWithCount } from '../types';

async function fetchKeywords(
  filterOptions: DocsFilterOptions = {}
): Promise<KeywordWithCount[]> {
  let query = supabase
    .from('keywords')
    .select('*')
    .eq('user_id', DEFAULT_USER_ID);

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

  // 각 키워드의 엔트리 개수 조회
  const keywordsWithCount = await Promise.all(
    (data || []).map(async (keyword) => {
      const { count } = await supabase
        .from('keyword_entries')
        .select('*', { count: 'exact', head: true })
        .eq('keyword_id', keyword.id);

      return {
        ...keyword,
        entry_count: count || 0,
      };
    })
  );

  return keywordsWithCount;
}

export function useKeywordsQuery(filterOptions: DocsFilterOptions = {}) {
  return useQuery({
    queryKey: ['keywords', filterOptions],
    queryFn: () => fetchKeywords(filterOptions),
  });
}
