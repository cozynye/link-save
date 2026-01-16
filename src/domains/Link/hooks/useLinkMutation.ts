'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { validateAccessKey } from '@/lib/auth';
import { DEFAULT_USER_ID } from '@/constants/config';
import type { LinkInsert, LinkUpdate } from '../types';

export function useLinkMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLink = async (
    linkData: Omit<LinkInsert, 'user_id'>,
    accessKey: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // 접근 키 검증
      if (!validateAccessKey(accessKey)) {
        throw new Error('잘못된 접근 키입니다');
      }

      // 현재 사용자 확인 (임시로 고정 user_id 사용)
      const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

      // 링크 생성
      const { data, error: insertError } = await supabase
        .from('links')
        .insert({
          ...linkData,
          user_id: DEFAULT_USER_ID,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '링크 저장에 실패했습니다';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLink = async (
    id: string,
    linkData: Partial<LinkUpdate>,
    accessKey: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // 접근 키 검증
      if (!validateAccessKey(accessKey)) {
        throw new Error('잘못된 접근 키입니다');
      }
      const { data, error: updateError } = await supabase
        .from('links')
        .update({
          ...linkData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '링크 수정에 실패했습니다';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLink = async (id: string, accessKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 접근 키 검증
      if (!validateAccessKey(accessKey)) {
        throw new Error('잘못된 접근 키입니다');
      }
      const { error: deleteError } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '링크 삭제에 실패했습니다';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createLink,
    updateLink,
    deleteLink,
    isLoading,
    error,
  };
}
