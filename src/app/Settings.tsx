import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { TagManager } from '@/features/tags/TagManager'
import { useUiStore, type SettingsTab } from '@/lib/uiStore'
import { cn } from '@/lib/utils'
import { useVaultStore } from '@/vault/store'
import { AppearancePanel } from './settings/AppearancePanel'
import { ConnectionPanel } from './settings/ConnectionPanel'
import { InfoFooter } from './settings/InfoFooter'
import { QuickSavePanel } from './settings/QuickSavePanel'

const TABS: { value: SettingsTab; label: string }[] = [
  { value: 'connection', label: '연결' },
  { value: 'tags', label: '태그' },
  { value: 'appearance', label: '모양' },
  { value: 'quick-save', label: '빠른 저장' },
]

export function SettingsSheet() {
  const open = useUiStore((s) => s.settingsOpen)
  const tab = useUiStore((s) => s.settingsTab)
  const openSettings = useUiStore((s) => s.openSettings)
  const closeSettings = useUiStore((s) => s.closeSettings)
  const vault = useVaultStore((s) => s.vault)

  return (
    <ResponsiveSheet open={open} onOpenChange={(next) => !next && closeSettings()} title="설정" footer={<InfoFooter />}>
      <div className="flex flex-col gap-5">
        <div role="tablist" aria-label="설정 탭" className="grid grid-cols-4 rounded-md bg-muted p-1">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => openSettings(item.value)}
              className={cn('h-11 rounded-lg text-sm transition-colors md:h-9', tab === item.value ? 'bg-card font-medium shadow-sm' : 'text-muted-foreground')}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {tab === 'connection' && <ConnectionPanel />}
          {tab === 'tags' && vault && <TagManager vault={vault} />}
          {tab === 'appearance' && <AppearancePanel />}
          {tab === 'quick-save' && <QuickSavePanel />}
        </div>
      </div>
    </ResponsiveSheet>
  )
}
