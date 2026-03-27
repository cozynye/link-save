'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUserId } from '@/lib/auth';
import type { Link, LinkInsert, LinkUpdate } from '../types';

async function createLinkFn(data: Omit<LinkInsert, 'user_id'>) {
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

async function updateLinkFn(id: string, data: Partial<LinkUpdate>) {
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

async function deleteLinkFn(id: string) {
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

async function togglePinLinkFn(id: string, isPinned: boolean) {
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

export function useCreateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<LinkInsert, 'user_id'>) => createLinkFn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast.success('링크가 추가되었습니다');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '링크 추가에 실패했습니다');
    },
  });
}

export function useUpdateLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LinkUpdate> }) =>
      updateLinkFn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
      toast.success('링크가 수정되었습니다');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '링크 수정에 실패했습니다');
    },
  });
}

export function useDeleteLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLinkFn(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['links'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['links'] });
      queryClient.setQueriesData<Link[]>({ queryKey: ['links'] }, (old) =>
        old?.filter((link) => link.id !== id)
      );
      return { previousData };
    },
    onError: (_error, _id, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error('링크 삭제에 실패했습니다');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
    onSuccess: () => {
      toast.success('링크가 삭제되었습니다');
    },
  });
}

export function useTogglePinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      togglePinLinkFn(id, isPinned),
    onMutate: async ({ id, isPinned }) => {
      await queryClient.cancelQueries({ queryKey: ['links'] });
      const previousData = queryClient.getQueriesData({ queryKey: ['links'] });
      queryClient.setQueriesData<Link[]>({ queryKey: ['links'] }, (old) =>
        old?.map((link) =>
          link.id === id ? { ...link, is_pinned: isPinned } : link
        )
      );
      return { previousData };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error('고정 변경에 실패했습니다');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}
