import { Drawer } from 'vaul'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { cn } from '@/lib/utils'

export interface ResponsiveSheetProps {
  open: boolean
  onOpenChange(open: boolean): void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function ResponsiveSheet({ open, onOpenChange, title, description, children, footer, className }: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-xl', className)}>
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className={description ? undefined : 'sr-only'}>{description ?? title}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t px-6 py-4">{footer}</div>}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn('fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] flex-col rounded-t-2xl border-t bg-card outline-none', className)}
        >
          <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <div className="px-5 pt-4">
            <Drawer.Title className="text-lg font-semibold">{title}</Drawer.Title>
            <Drawer.Description className={description ? 'text-sm text-muted-foreground' : 'sr-only'}>{description ?? title}</Drawer.Description>
          </div>
          <div className={cn('flex-1 overflow-y-auto px-5 py-4', !footer && 'safe-bottom')}>{children}</div>
          {footer && <div className="safe-bottom border-t px-5 pt-4">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
