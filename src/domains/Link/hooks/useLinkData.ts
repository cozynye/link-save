'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { DEFAULT_USER_ID } from '@/constants/config';
import type { Link, LinkFilterOptions } from '../types';

interface UseLinkDataReturn {
  links: Link[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLinkData(
  filterOptions?: LinkFilterOptions
): UseLinkDataReturn {
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('links')
        .select('*')
        .eq('user_id', 'DEFAULT_USER_ID');

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

      // 정렬
      const sortBy = filterOptions?.sortBy || 'created_at';
      const sortOrder = filterOptions?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setLinks(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '링크를 불러오는데 실패했습니다';
      setError(errorMessage);
      console.error('링크 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드 및 필터 옵션 변경 시 재조회
  useEffect(() => {
    fetchLinks();
  }, [
    filterOptions?.tags?.join(','),
    filterOptions?.searchQuery,
    filterOptions?.sortBy,
    filterOptions?.sortOrder,
  ]);

  // 실시간 업데이트 구독
  useEffect(() => {
    const channel = supabase
      .channel('links_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'links',
          filter: `user_id=eq.DEFAULT_USER_ID`,
        },
        () => {
          // 데이터 변경 시 목록 다시 가져오기
          fetchLinks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    links,
    isLoading,
    error,
    refetch: fetchLinks,
  };
}
