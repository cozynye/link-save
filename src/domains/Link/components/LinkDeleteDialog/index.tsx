'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteLinkMutation } from '../../hooks/useLinkMutations';
import type { Link } from '../../types';

interface LinkDeleteDialogProps {
  link: Link | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LinkDeleteDialog({
  link,
  open,
  onOpenChange,
  onSuccess,
}: LinkDeleteDialogProps) {
  const [accessKey, setAccessKey] = useState('');
  const [accessKeyError, setAccessKeyError] = useState('');
  const deleteLinkMutation = useDeleteLinkMutation();

  const isLoading = deleteLinkMutation.isPending;
  const error = deleteLinkMutation.error;

  const handleDelete = () => {
    if (!link) return;

    // 접근 키 검증
    if (!accessKey.trim()) {
      setAccessKeyError('접근 키를 입력해주세요');
      return;
    }

    deleteLinkMutation.mutate(
      {
        id: link.id,
        accessKey: accessKey.trim(),
      },
      {
        onSuccess: () => {
          // 성공 시 다이얼로그 닫고 초기화
          setAccessKey('');
          setAccessKeyError('');
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const handleCancel = () => {
    setAccessKey('');
    setAccessKeyError('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>링크 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            정말로 이 링크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {link && (
          <div className="my-4 p-4 rounded-md bg-muted">
            <p className="font-semibold">{link.title}</p>
            <p className="text-sm text-muted-foreground break-all mt-1">
              {link.url}
            </p>
          </div>
        )}

        {/* 접근 키 입력 */}
        <div className="space-y-2">
          <Label htmlFor="delete-accessKey">
            접근 키 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="delete-accessKey"
            type="password"
            placeholder="접근 키를 입력하세요"
            value={accessKey}
            onChange={(e) => {
              setAccessKey(e.target.value);
              setAccessKeyError('');
            }}
            className={accessKeyError ? 'border-destructive' : ''}
            disabled={isLoading}
          />
          {accessKeyError && (
            <p className="text-sm text-destructive">{accessKeyError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            삭제를 위해 접근 키가 필요합니다
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? '삭제 중...' : '삭제'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
