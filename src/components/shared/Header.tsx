'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { isAuthenticated, logout } from '@/lib/auth';

interface HeaderProps {
  actions?: React.ReactNode;
}

export function Header({ actions }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  const isProtectedPage = pathname?.startsWith('/docs') || pathname?.startsWith('/link');

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated();
      setIsAuthed(authed);
    };
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto max-w-[1240px] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <h1 className="text-2xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
                기억
              </h1>
            </Link>
            <Link
              href="/link"
              className={`text-sm transition-colors ${
                pathname?.startsWith('/link')
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Link
            </Link>
            <Link
              href="/docs"
              className={`text-sm transition-colors ${
                pathname?.startsWith('/docs')
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {actions}

            {isAuthed && isProtectedPage && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
