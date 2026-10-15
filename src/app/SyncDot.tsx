import { cn } from '@/lib/utils'
import { useVaultStore, type VaultStatus } from '@/vault/store'

export type SyncTone = 'ok' | 'busy' | 'error' | 'muted'

export function syncDotState(status: VaultStatus, pendingCount: number, writing: boolean, online: boolean): { tone: SyncTone; label: string } {
  if (status === 'auth-error' || status === 'error' || status === 'invalid-file' || status === 'unsupported-version' || status === 'oversize') {
    return { tone: 'error', label: '동기화 문제' }
  }
  if (!online || status === 'offline') return { tone: 'muted', label: '오프라인' }
  if (status === 'loading' || writing || pendingCount > 0) return { tone: 'busy', label: '동기화 중' }
  return { tone: 'ok', label: '동기화됨' }
}

// 정상(ok)일 때는 아무것도 그리지 않는다. 알릴 것이 있을 때만 점이 보인다.
const TONE_CLASS: Record<Exclude<SyncTone, 'ok'>, string> = {
  busy: 'bg-muted-foreground animate-pulse',
  error: 'bg-destructive',
  muted: 'bg-muted-foreground/50',
}

export function SyncDot() {
  const status = useVaultStore((s) => s.status)
  const pendingCount = useVaultStore((s) => s.pendingCount)
  const writing = useVaultStore((s) => s.writing)
  const online = useVaultStore((s) => s.online)
  const { tone, label } = syncDotState(status, pendingCount, writing, online)
  if (tone === 'ok') return null
  return <span role="status" aria-label={label} title={label} className={cn('inline-block size-1.5 rounded-full', TONE_CLASS[tone])} />
}
