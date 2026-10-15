import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/lib/uiStore'
import { SyncDot } from './SyncDot'

export function Header() {
  const openSettings = useUiStore((s) => s.openSettings)
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight">SaveLink</h1>
          <SyncDot />
        </div>
        <Button variant="ghost" size="icon" aria-label="설정" onClick={() => openSettings()} className="size-11 md:size-9">
          <Settings className="size-5" />
        </Button>
      </div>
    </header>
  )
}
