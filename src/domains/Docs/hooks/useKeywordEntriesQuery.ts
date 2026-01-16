import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { KeywordEntry } from '../types';

async function fetchKeywordEntries(keywordId: string): Promise<KeywordEntry[]> {
  const { data, error } = await supabase
    .from('keyword_entries')
    .select('*')
    .eq('keyword_id', keywordId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export function useKeywordEntriesQuery(keywordId: string | undefined) {
  return useQuery({
    queryKey: ['keyword_entries', keywordId],
    queryFn: () => fetchKeywordEntries(keywordId!),
    enabled: !!keywordId,
  });
}
