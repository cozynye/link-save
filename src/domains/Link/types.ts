import type { Database } from '@/lib/supabase/types';

// Supabase 테이블 타입에서 추출
export type Link = Database['public']['Tables']['links']['Row'];
export type LinkInsert = Database['public']['Tables']['links']['Insert'];
export type LinkUpdate = Database['public']['Tables']['links']['Update'];

// 프론트엔드에서 사용할 추가 타입들
export interface LinkFormData {
  url: string;
  title: string;
  description?: string;
  tags: string[];
}

export interface LinkFilterOptions {
  tags?: string[];
  searchQuery?: string;
  sortBy?: 'created_at' | 'title' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}
