'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LinkForm } from '@/domains/Link/components/LinkForm';

interface HeaderProps {
  onLinkAdded?: () => void;
}

export function Header({ onLinkAdded }: HeaderProps) {
  const pathname = usePathname();
  const isDocsPage = pathname?.startsWith('/docs');

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDocsPage ? (
              <>
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
          {!isDocsPage && <LinkForm onSuccess={onLinkAdded} />}
        </div>
      </div>
    </header>
  );
}
