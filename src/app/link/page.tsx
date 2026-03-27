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
    // React Query가 자동으로 쿼리를 무효화하여 목록을 갱신
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
    togglePinMutation.mutate({
      id: link.id,
      isPinned: !link.is_pinned,
    });
  };

  return (
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <Header actions={<LinkForm onSuccess={handleLinkAdded} />} />

        {/* Main Content */}
        <div className="container mx-auto max-w-[1240px] px-4 py-8">
          {/* 필터 */}
          <div className="mb-4">
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
