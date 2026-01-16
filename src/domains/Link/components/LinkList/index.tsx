'use client';

import { LinkCard } from '../LinkCard';
import { useLinksQuery } from '../../hooks/useLinksQuery';
import type { Link, LinkFilterOptions } from '../../types';
import { Loader2, AlertCircle, BookmarkX } from 'lucide-react';

interface LinkListProps {
  filterOptions?: LinkFilterOptions;
  onEditLink?: (link: Link) => void;
  onDeleteLink?: (link: Link) => void;
  onTogglePin?: (link: Link) => void;
}

export function LinkList({
  filterOptions,
  onEditLink,
  onDeleteLink,
  onTogglePin,
}: LinkListProps) {
  const { data: links = [], isLoading, error } = useLinksQuery(filterOptions);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>링크를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold mb-2">링크를 불러오는데 실패했습니다</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
        </p>
      </div>
    );
  }

  // 빈 상태
  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BookmarkX className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold mb-2">저장된 링크가 없습니다</p>
        <p className="text-sm">
          {filterOptions?.searchQuery || filterOptions?.tags?.length
            ? '검색 조건에 맞는 링크가 없습니다'
            : '새로운 링크를 추가해보세요'}
        </p>
      </div>
    );
  }

  // 링크 목록 표시
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          onEdit={onEditLink}
          onDelete={onDeleteLink}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}
