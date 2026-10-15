import { CircleAlert, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/lib/uiStore'
import { cn } from '@/lib/utils'
import { useVaultStore, type VaultState } from '@/vault/store'

export interface Banner {
  tone: 'warning' | 'error' | 'muted'
  title: string
  description?: string
  action?: 'open-connection' | 'reload' | 'open-github'
}

const OFFLINE_BANNER: Banner = { tone: 'muted', title: '오프라인이라 읽기만 가능해요', description: '연결되면 자동으로 다시 불러와요.' }

export function bannerFor(state: Pick<VaultState, 'status' | 'errorDetail' | 'settings' | 'online'>): Banner | null {
  if (!state.online && state.status !== 'disconnected') return OFFLINE_BANNER
  switch (state.status) {
    case 'ready':
    case 'loading':
    case 'disconnected':
      return null
    case 'auth-error':
      return { tone: 'error', title: '토큰을 확인해 주세요', description: '권한이 없거나 만료되었어요. 목록은 마지막 사본이고 변경은 재연결 뒤에 보내져요.', action: 'open-connection' }
    case 'offline':
      return OFFLINE_BANNER
    case 'invalid-file':
      return { tone: 'error', title: '파일 형식이 올바르지 않습니다. GitHub에서 확인해 주세요', description: state.errorDetail ?? undefined, action: 'open-github' }
    case 'unsupported-version':
      return { tone: 'error', title: `지원하지 않는 파일 버전입니다 (${state.errorDetail ?? '?'})`, description: '앱을 업데이트하거나 파일의 version을 확인해 주세요.', action: 'open-github' }
    case 'oversize':
      return { tone: 'error', title: '파일이 1MB를 넘어 읽을 수 없습니다', description: '링크를 나누어 보관하는 방식이 필요해요. 쓰기는 막혀 있어요.', action: 'open-github' }
    case 'error':
      return { tone: 'warning', title: '불러오지 못했어요', description: state.errorDetail ?? undefined, action: 'reload' }
  }
}

const TONE_CLASS: Record<Banner['tone'], string> = {
  warning: 'border-amber-300/60 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100',
  error: 'border-destructive/30 bg-destructive/10 text-foreground',
  muted: 'border-border bg-muted text-muted-foreground',
}

export function StatusBanner() {
  const status = useVaultStore((s) => s.status)
  const errorDetail = useVaultStore((s) => s.errorDetail)
  const settings = useVaultStore((s) => s.settings)
  const online = useVaultStore((s) => s.online)
  const reload = useVaultStore((s) => s.reload)
  const openSettings = useUiStore((s) => s.openSettings)
  const banner = bannerFor({ status, errorDetail, settings, online })
  if (!banner) return null

  const repoUrl = settings ? `https://github.com/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}` : 'https://github.com'

  return (
    <div role="status" className={cn('mb-4 flex flex-wrap items-start gap-3 rounded-md border px-4 py-3 text-sm', TONE_CLASS[banner.tone])}>
      {banner.tone === 'muted' ? <WifiOff aria-hidden className="mt-0.5 size-4 shrink-0" /> : <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{banner.title}</p>
        {banner.description && <p className="mt-0.5 break-words opacity-80">{banner.description}</p>}
      </div>
      {banner.action === 'open-connection' && (
        <Button size="sm" variant="outline" className="h-11 md:h-8" onClick={() => openSettings('connection')}>설정 열기</Button>
      )}
      {banner.action === 'reload' && (
        <Button size="sm" variant="outline" className="h-11 md:h-8" onClick={() => void reload()}>다시 시도</Button>
      )}
      {banner.action === 'open-github' && (
        <Button size="sm" variant="outline" className="h-11 md:h-8" asChild>
          <a href={repoUrl} target="_blank" rel="noreferrer">GitHub에서 열기</a>
        </Button>
      )}
    </div>
  )
}
