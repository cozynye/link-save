// @ts-nocheck - Supabase type inference issues with insert/update operations
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/auth';
import type { EntryFormData, KeywordEntry } from '../types';

// 키워드 생성 또는 기존 키워드 ID 반환
async function getOrCreateKeyword(
  keywordName: string,
  tags: string[]
): Promise<string> {
  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
  }

  // 기존 키워드 검색
  const { data: existing } = await supabase
    .from('keywords')
    .select('id')
    .eq('user_id', userId)
    .eq('name', keywordName)
    .single<{ id: string }>();

  if (existing) {
    return existing.id;
  }

  // 새 키워드 생성
  // @ts-ignore - Supabase type inference issue
  const { data: newKeyword, error } = await supabase
    .from('keywords')
    .insert({
      user_id: userId,
      name: keywordName,
      tags,
    })
    .select()
    .single<{ id: string }>();

  if (error) {
    throw error;
  }

  if (!newKeyword) {
    throw new Error('키워드 생성에 실패했습니다');
  }

  return newKeyword.id;
}

// 엔트리 생성
async function createEntryFn(data: EntryFormData): Promise<KeywordEntry> {
  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
  }

  let keywordId: string;

  if (data.keywordId) {
    // 기존 키워드에 추가
    keywordId = data.keywordId;
  } else if (data.keywordName) {
    // 새 키워드 생성 또는 기존 키워드 사용
    keywordId = await getOrCreateKeyword(data.keywordName, data.tags || []);
  } else {
    throw new Error('키워드 ID 또는 키워드명이 필요합니다');
  }

  // @ts-ignore - Supabase type inference issue
  const { data: entry, error } = await supabase
    .from('keyword_entries')
    .insert({
      keyword_id: keywordId,
      title: data.title || null,
      content: data.content,
    })
    .select()
    .single<KeywordEntry>();

  if (error) {
    throw error;
  }

  if (!entry) {
    throw new Error('엔트리 생성에 실패했습니다');
  }

  return entry;
}

// 엔트리 수정
async function updateEntryFn(
  id: string,
  data: Partial<EntryFormData>
): Promise<KeywordEntry> {
  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
  }

  // @ts-ignore - Supabase type inference issue
  const { data: entry, error } = await supabase
    .from('keyword_entries')
    .update({
      title: data.title || null,
      content: data.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single<KeywordEntry>();

  if (error) {
    throw error;
  }

  if (!entry) {
    throw new Error('엔트리 수정에 실패했습니다');
  }

  return entry;
}

// 엔트리 삭제
async function deleteEntryFn(id: string) {
  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
  }

  const { error } = await supabase.from('keyword_entries').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// 키워드 삭제 (모든 엔트리도 함께 삭제됨 - CASCADE)
async function deleteKeywordFn(id: string) {
  // Check authentication
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다');
  }

  const { error } = await supabase.from('keywords').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// Mutation hooks
export function useCreateEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EntryFormData) => createEntryFn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      queryClient.invalidateQueries({ queryKey: ['keyword_entries'] });
    },
  });
}

export function useUpdateEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EntryFormData> }) =>
      updateEntryFn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword_entries'] });
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}

export function useDeleteEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEntryFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword_entries'] });
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}

export function useDeleteKeywordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteKeywordFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      queryClient.invalidateQueries({ queryKey: ['keyword_entries'] });
    },
  });
}
