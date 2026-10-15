import { Pin } from 'lucide-react'
import { useUiStore } from '@/lib/uiStore'
import { cn } from '@/lib/utils'
import { orderedTags, pinnedCount, tagCounts } from '@/vault/derive'
import type { Vault } from '@/vault/schema'
import { TagChip } from './TagChip'

export function TagChipRow({ vault }: { vault: Vault }) {
  const filter = useUiStore((s) => s.filter)
  const toggleTag = useUiStore((s) => s.toggleTag)
  const clearTags = useUiStore((s) => s.clearTags)
  const setPinnedOnly = useUiStore((s) => s.setPinnedOnly)
  const counts = tagCounts(vault)
  const allActive = filter.tagIds.length === 0 && !filter.pinnedOnly
  const pill = (active: boolean) =>
    cn('inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium', active ? 'border-foreground bg-foreground text-background' : 'bg-card text-muted-foreground')

  return (
    <div role="group" aria-label="태그 필터" className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
      <button type="button" aria-pressed={allActive} onClick={() => { clearTags(); setPinnedOnly(false) }} className={pill(allActive)}>
        전체 <span className="tabular-nums opacity-70">{vault.links.length}</span>
      </button>
      <button type="button" aria-pressed={filter.pinnedOnly} onClick={() => setPinnedOnly(!filter.pinnedOnly)} className={pill(filter.pinnedOnly)}>
        <Pin aria-hidden className="size-3.5" /> 고정됨 <span className="tabular-nums opacity-70">{pinnedCount(vault)}</span>
      </button>
      {orderedTags(vault).map((tag) => (
        <TagChip key={tag.id} tag={tag} count={counts.get(tag.id) ?? 0} selected={filter.tagIds.includes(tag.id)} onClick={() => toggleTag(tag.id)} className="h-11 shrink-0" />
      ))}
    </div>
  )
}
