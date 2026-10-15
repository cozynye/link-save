import { Inbox, Pin, Tag as TagIcon } from 'lucide-react'
import { useUiStore } from '@/lib/uiStore'
import { cn } from '@/lib/utils'
import { orderedTags, pinnedCount, tagCounts } from '@/vault/derive'
import type { Vault } from '@/vault/schema'
import { TAG_DOT_CLASS } from './palette'

interface ItemProps {
  active: boolean
  onClick(): void
  icon: React.ReactNode
  label: string
  count: number
}

function SidebarItem({ active, onClick, icon, label, count }: ItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition-colors',
        active ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      <span aria-hidden className="grid size-4 place-items-center [&>svg]:size-4">{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      <span className="tabular-nums text-xs opacity-70">{count}</span>
    </button>
  )
}

export function TagSidebar({ vault }: { vault: Vault }) {
  const filter = useUiStore((s) => s.filter)
  const toggleTag = useUiStore((s) => s.toggleTag)
  const clearTags = useUiStore((s) => s.clearTags)
  const setPinnedOnly = useUiStore((s) => s.setPinnedOnly)
  const openSettings = useUiStore((s) => s.openSettings)
  const counts = tagCounts(vault)
  const tags = orderedTags(vault)
  const allActive = filter.tagIds.length === 0 && !filter.pinnedOnly

  return (
    <aside aria-label="태그" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto py-6 md:block">
      <nav className="flex flex-col gap-0.5">
        <SidebarItem active={allActive} onClick={() => { clearTags(); setPinnedOnly(false) }} icon={<Inbox />} label="전체" count={vault.links.length} />
        <SidebarItem active={filter.pinnedOnly} onClick={() => setPinnedOnly(!filter.pinnedOnly)} icon={<Pin />} label="고정됨" count={pinnedCount(vault)} />
        <div className="my-3 border-t" />
        {tags.map((tag) => (
          <SidebarItem
            key={tag.id}
            active={filter.tagIds.includes(tag.id)}
            onClick={() => toggleTag(tag.id)}
            icon={<span className={cn('size-2.5 rounded-full', TAG_DOT_CLASS[tag.color])} />}
            label={tag.name}
            count={counts.get(tag.id) ?? 0}
          />
        ))}
        {tags.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">아직 태그가 없어요</p>}
        <button
          type="button"
          onClick={() => openSettings('tags')}
          className="mt-3 flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        >
          <TagIcon aria-hidden className="size-4" />
          태그 관리
        </button>
      </nav>
    </aside>
  )
}
