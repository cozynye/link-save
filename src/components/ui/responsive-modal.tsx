'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ResponsiveModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResponsiveModal({ children, open: controlledOpen, onOpenChange }: ResponsiveModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {children}
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children}
    </Sheet>
  );
}

interface ResponsiveModalTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function ResponsiveModalTrigger({ children, asChild }: ResponsiveModalTriggerProps) {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (isDesktop) {
    return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
  }

  return <SheetTrigger asChild={asChild}>{children}</SheetTrigger>;
}

interface ResponsiveModalContentProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function ResponsiveModalContent({ children, title, description }: ResponsiveModalContentProps) {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // children을 배열로 변환하여 Footer와 일반 콘텐츠를 분리
  const childrenArray = React.Children.toArray(children);
  const footer = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === ResponsiveModalFooter
  );
  const content = childrenArray.filter(
    (child) => !(React.isValidElement(child) && child.type === ResponsiveModalFooter)
  );

  if (isDesktop) {
    return (
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    );
  }

  return (
    <SheetContent
      side="bottom"
      className="h-[85vh] rounded-t-lg p-0 flex flex-col"
    >
      <SheetHeader className="px-4">
        <SheetTitle>{title}</SheetTitle>
        {description && <SheetDescription>{description}</SheetDescription>}
      </SheetHeader>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide mt-3">
        {content}
      </div>

      {/* 하단 고정 버튼 영역 */}
      {footer}
    </SheetContent>
  );
}

interface ResponsiveModalFooterProps {
  children: React.ReactNode;
}

export function ResponsiveModalFooter({ children }: ResponsiveModalFooterProps) {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (isDesktop) {
    return (
      <div className="flex justify-end gap-2 mt-6">
        {children}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 flex gap-2 p-4 bg-background border-t">
      {children}
    </div>
  );
}
