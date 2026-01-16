// @ts-nocheck - Supabase type inference issues with insert/update operations
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { validateAccessKey } from '@/lib/auth';
import { DEFAULT_USER_ID } from '@/constants/config';
import type { EntryFormData, KeywordEntry } from '../types';

// 키워드 생성 또는 기존 키워드 ID 반환
async function getOrCreateKeyword(
  keywordName: string,
  tags: string[],
  accessKey: string
): Promise<string> {
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
  }

  // 기존 키워드 검색
  const { data: existing } = await supabase
    .from('keywords')
    .select('id')
    .eq('user_id', DEFAULT_USER_ID)
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
      user_id: DEFAULT_USER_ID,
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
async function createEntryFn(data: EntryFormData, accessKey: string): Promise<KeywordEntry> {
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
  }

  let keywordId: string;

  if (data.keywordId) {
    // 기존 키워드에 추가
    keywordId = data.keywordId;
  } else if (data.keywordName) {
    // 새 키워드 생성 또는 기존 키워드 사용
    keywordId = await getOrCreateKeyword(
      data.keywordName,
      data.tags || [],
      accessKey
    );
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
  data: Partial<EntryFormData>,
  accessKey: string
): Promise<KeywordEntry> {
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
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
async function deleteEntryFn(id: string, accessKey: string) {
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
  }

  const { error } = await supabase.from('keyword_entries').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

// 키워드 삭제 (모든 엔트리도 함께 삭제됨 - CASCADE)
async function deleteKeywordFn(id: string, accessKey: string) {
  if (!validateAccessKey(accessKey)) {
    throw new Error('잘못된 접근 키입니다');
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
    mutationFn: ({ data, accessKey }: { data: EntryFormData; accessKey: string }) =>
      createEntryFn(data, accessKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      queryClient.invalidateQueries({ queryKey: ['keyword_entries'] });
    },
  });
}

export function useUpdateEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      accessKey,
    }: {
      id: string;
      data: Partial<EntryFormData>;
      accessKey: string;
    }) => updateEntryFn(id, data, accessKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword_entries'] });
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}

export function useDeleteEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, accessKey }: { id: string; accessKey: string }) =>
      deleteEntryFn(id, accessKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword_entries'] });
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
    },
  });
}

export function useDeleteKeywordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, accessKey }: { id: string; accessKey: string }) =>
      deleteKeywordFn(id, accessKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] });
      queryClient.invalidateQueries({ queryKey: ['keyword_entries'] });
    },
  });
}
