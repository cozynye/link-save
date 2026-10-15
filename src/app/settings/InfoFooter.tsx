import { formatBytes } from '@/lib/format'
import { serializeVault } from '@/vault/schema'
import { useVaultStore } from '@/vault/store'

export function InfoFooter() {
  const vault = useVaultStore((s) => s.vault)
  const lastSyncedAt = useVaultStore((s) => s.lastSyncedAt)
  const bytes = vault ? new TextEncoder().encode(serializeVault(vault)).length : 0
  const synced = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString('ko-KR') : '없음'
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-4">
      <dt>링크</dt>
      <dd className="tabular-nums">{vault?.links.length ?? 0}개</dd>
      <dt>파일 크기</dt>
      <dd className="tabular-nums">{formatBytes(bytes)}</dd>
      <dt>마지막 동기화</dt>
      <dd>{synced}</dd>
      <dt>버전</dt>
      <dd>{__APP_VERSION__}</dd>
    </dl>
  )
}
