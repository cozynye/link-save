'use client';

import { LinkForm } from '@/domains/Link/components/LinkForm';

interface HeaderProps {
  onLinkAdded?: () => void;
}

export function Header({ onLinkAdded }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">SaveLink</h1>
            <span className="text-muted-foreground text-sm hidden sm:inline">
              링크를 저장하고 관리하세요
            </span>
          </div>
          <LinkForm onSuccess={onLinkAdded} />
        </div>
      </div>
    </header>
  );
}
