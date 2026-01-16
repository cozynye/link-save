import type { Database } from '@/lib/supabase/types';

// Supabase 타입에서 추출
export type Keyword = Database['public']['Tables']['keywords']['Row'];
export type KeywordEntry = Database['public']['Tables']['keyword_entries']['Row'];

// 폼 데이터 타입
export interface KeywordFormData {
  name: string;
  description?: string;
  tags: string[];
}

export interface EntryFormData {
  keywordId?: string; // 기존 키워드에 추가할 때
  keywordName?: string; // 새 키워드 생성 시
  title?: string;
  content: string;
  tags?: string[]; // 키워드 태그 (새 키워드 생성 시)
}

// 키워드와 엔트리 개수 포함
export interface KeywordWithCount extends Keyword {
  entry_count?: number;
}

// 엔트리와 키워드 정보 포함
export interface EntryWithKeyword extends KeywordEntry {
  keyword?: Keyword;
}

// 검색/필터 옵션
export interface DocsFilterOptions {
  searchKeyword?: string;
  tags?: string[];
  sortBy?: 'updated_at' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}
