'use client';

import { useState } from 'react';
import { Header } from '@/components/shared/Header';
import { LinkForm } from '@/domains/Link/components/LinkForm';
import { LinkList } from '@/domains/Link/components/LinkList';
import { LinkFilter } from '@/domains/Link/components/LinkFilter';
import { LinkDeleteDialog } from '@/domains/Link/components/LinkDeleteDialog';
import { useTogglePinMutation } from '@/domains/Link/hooks/useLinkMutations';
import type { Link, LinkFilterOptions } from '@/domains/Link/types';

export default function Home() {
  const [filterOptions, setFilterOptions] = useState<LinkFilterOptions>({});
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [deletingLink, setDeletingLink] = useState<Link | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const togglePinMutation = useTogglePinMutation();

  const handleLinkAdded = () => {
    console.log('링크가 추가되었습니다!');
    // LinkList는 실시간 구독으로 자동 업데이트됨
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsEditFormOpen(true);
  };

  const handleDeleteLink = (link: Link) => {
    setDeletingLink(link);
  };

  const handleEditSuccess = () => {
    setEditingLink(null);
    setIsEditFormOpen(false);
  };

  const handleDeleteSuccess = () => {
    setDeletingLink(null);
  };

  const handleTogglePin = (link: Link) => {
    const accessKey = prompt('접근 키를 입력하세요:');
    if (!accessKey) return;

    togglePinMutation.mutate({
      id: link.id,
      isPinned: !link.is_pinned,
      accessKey,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <Header onLinkAdded={handleLinkAdded} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* 필터 */}
        <div className="mb-8">
          <LinkFilter onFilterChange={setFilterOptions} />
        </div>

        {/* 링크 목록 */}
        <div>
          <LinkList
            filterOptions={filterOptions}
            onEditLink={handleEditLink}
            onDeleteLink={handleDeleteLink}
            onTogglePin={handleTogglePin}
          />
        </div>
      </div>

      {/* 링크 수정 폼 */}
      <LinkForm
        editLink={editingLink}
        open={isEditFormOpen}
        onOpenChange={setIsEditFormOpen}
        onSuccess={handleEditSuccess}
      />

      {/* 링크 삭제 다이얼로그 */}
      <LinkDeleteDialog
        link={deletingLink}
        open={!!deletingLink}
        onOpenChange={(open) => !open && setDeletingLink(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
