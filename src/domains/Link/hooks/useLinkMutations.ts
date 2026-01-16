// @ts-nocheck - Supabase type inference issues
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { validateAccessKey } from '@/lib/auth';
import { DEFAULT_USER_ID } from '@/constants/config';
import type { LinkInsert, LinkUpdate } from '../types';
import { getLinksQueryKey } from './useLinksQuery';

// 링크 생성 함수
async function createLinkFn(
  data: Omit<LinkInsert, 'user_id'>,
  accessKey: string
) {
  // 접근 키 검증
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
  }

  const { data: link, error } = await supabase
    .from('links')
    .insert({
      ...data,
      user_id: DEFAULT_USER_ID,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return link;
}

// 링크 수정 함수
async function updateLinkFn(
  id: string,
  data: Partial<LinkUpdate>,
  accessKey: string
) {
  // 접근 키 검증
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
  }

  const { data: link, error } = await supabase
    .from('links')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return link;
}

// 링크 삭제 함수
async function deleteLinkFn(id: string, accessKey: string) {
  // 접근 키 검증
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
  }

  const { error } = await supabase.from('links').delete().eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}

// useCreateLinkMutation 훅
export function useCreateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      accessKey,
    }: {
      data: Omit<LinkInsert, 'user_id'>;
      accessKey: string;
    }) => createLinkFn(data, accessKey),
    onSuccess: () => {
      // 모든 링크 쿼리 무효화하여 재조회 (필터 옵션과 무관하게 'links'로 시작하는 모든 쿼리)
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}

// useUpdateLinkMutation 훅
export function useUpdateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      accessKey,
    }: {
      id: string;
      data: Partial<LinkUpdate>;
      accessKey: string;
    }) => updateLinkFn(id, data, accessKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}

// useDeleteLinkMutation 훅
export function useDeleteLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, accessKey }: { id: string; accessKey: string }) =>
      deleteLinkFn(id, accessKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}

// 링크 고정 토글 함수
async function togglePinLinkFn(
  id: string,
  isPinned: boolean,
  accessKey: string
) {
  // 접근 키 검증
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
  }

  const { data: link, error } = await supabase
    .from('links')
    .update({
      is_pinned: isPinned,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return link;
}

// useTogglePinMutation 훅
export function useTogglePinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isPinned,
      accessKey,
    }: {
      id: string;
      isPinned: boolean;
      accessKey: string;
    }) => togglePinLinkFn(id, isPinned, accessKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}
