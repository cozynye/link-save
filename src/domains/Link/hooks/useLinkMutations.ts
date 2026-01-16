// @ts-nocheck - Supabase type inference issues
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/auth';
import type { LinkInsert, LinkUpdate } from '../types';
import { getLinksQueryKey } from './useLinksQuery';

// 링크 생성 함수
async function createLinkFn(data: Omit<LinkInsert, 'user_id'>) {
  // Get current user ID from session
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
  }

  const { data: link, error } = await supabase
    .from('links')
    .insert({
      ...data,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return link;
}

// 링크 수정 함수
async function updateLinkFn(id: string, data: Partial<LinkUpdate>) {
  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
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
async function deleteLinkFn(id: string) {
  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
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
    mutationFn: (data: Omit<LinkInsert, 'user_id'>) => createLinkFn(data),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<LinkUpdate> }) =>
      updateLinkFn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}

// useDeleteLinkMutation 훅
export function useDeleteLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLinkFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}

// 링크 고정 토글 함수
async function togglePinLinkFn(id: string, isPinned: boolean) {
  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
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
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      togglePinLinkFn(id, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}
