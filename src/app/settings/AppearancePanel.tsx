import { Monitor, Moon, Sun } from 'lucide-react'
import type { ThemePref } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { useVaultStore } from '@/vault/store'

const OPTIONS: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: '시스템', icon: <Monitor className="size-4" /> },
  { value: 'light', label: '라이트', icon: <Sun className="size-4" /> },
  { value: 'dark', label: '다크', icon: <Moon className="size-4" /> },
]

export function AppearancePanel() {
  const theme = useVaultStore((s) => s.settings?.theme ?? 'system')
  const setTheme = useVaultStore((s) => s.setTheme)
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">테마</legend>
      <div role="radiogroup" className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const checked = theme === option.value
          return (
            <label
              key={option.value}
              className={cn(
                'flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm transition-colors',
                checked ? 'border-foreground bg-accent font-medium' : 'text-muted-foreground hover:bg-accent/60',
              )}
            >
              <input type="radio" name="theme" value={option.value} checked={checked} onChange={() => setTheme(option.value)} className="sr-only" />
              {option.icon}
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
