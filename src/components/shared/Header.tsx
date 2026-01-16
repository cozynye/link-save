'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LinkForm } from '@/domains/Link/components/LinkForm';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';

interface HeaderProps {
  onLinkAdded?: () => void;
}

export function Header({ onLinkAdded }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDocsPage = pathname?.startsWith('/docs');

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDocsPage ? (
              <>
                <BookOpen className="h-5 w-5" />
                <h1 className="text-2xl font-bold tracking-tight">Docs</h1>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  SaveLink
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight">SaveLink</h1>
                <Link
                  href="/docs"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Docs
                </Link>
              </>
            )}
          </div>
          {isDocsPage ? (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => router.push('/docs/new')}
            >
              <Plus className="h-4 w-4" />
              새 엔트리
            </Button>
          ) : (
            <LinkForm onSuccess={onLinkAdded} />
          )}
        </div>
      </div>
    </header>
  );
}
