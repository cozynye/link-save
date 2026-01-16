'use client';

import { useState } from 'react';
import { useDeleteEntryMutation } from '../../hooks/useDocsMutations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { KeywordEntry } from '../../types';

interface EntryDeleteDialogProps {
  entry: KeywordEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EntryDeleteDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: EntryDeleteDialogProps) {
  const [error, setError] = useState('');
  const deleteEntryMutation = useDeleteEntryMutation();

  const handleDelete = async () => {
    if (!entry) return;

    deleteEntryMutation.mutate(entry.id, {
      onSuccess: () => {
        setError('');
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (error) => {
        setError(error instanceof Error ? error.message : '삭제에 실패했습니다');
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError('');
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>엔트리 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            {entry?.title ? `"${entry.title}"` : '이 엔트리'}를 정말 삭제하시겠습니까?
            이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteEntryMutation.isPending}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleteEntryMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteEntryMutation.isPending ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
