import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

// 개발 환경에서는 경고만 표시
if (
  typeof window !== 'undefined' &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
) {
  console.warn(
    '⚠️ Supabase 환경 변수가 설정되지 않았습니다. README를 참고하여 Supabase 프로젝트를 생성하고 .env.local을 설정하세요.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
