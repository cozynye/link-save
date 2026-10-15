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

const TONE_CLASS: Record<SyncTone, string> = {
  ok: 'bg-emerald-500',
  busy: 'bg-amber-500 animate-pulse',
  error: 'bg-destructive',
  muted: 'bg-muted-foreground/50',
}

export function SyncDot() {
  const status = useVaultStore((s) => s.status)
  const pendingCount = useVaultStore((s) => s.pendingCount)
  const writing = useVaultStore((s) => s.writing)
  const online = useVaultStore((s) => s.online)
  const { tone, label } = syncDotState(status, pendingCount, writing, online)
  return <span role="status" aria-label={label} title={label} className={cn('inline-block size-2 rounded-full', TONE_CLASS[tone])} />
}
