import { useMemo } from 'react'
import { Bookmark, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { useUiStore } from '@/lib/uiStore'
import type { Link, Tag } from '@/vault/schema'
import { useVaultStore } from '@/vault/store'
import { EmptyState } from './EmptyState'
import { LinkCard } from './LinkCard'
import { LinkRow } from './LinkRow'

export function LinkGrid({ links, totalCount }: { links: Link[]; totalCount: number }) {
  const tags = useVaultStore((s) => s.vault?.tags)
  const resetFilter = useUiStore((s) => s.resetFilter)
  const isDesktop = useIsDesktop()
  const tagById = useMemo(() => new Map((tags ?? []).map((t) => [t.id, t])), [tags])
  const tagsOf = (link: Link): Tag[] => link.tags.map((id) => tagById.get(id)).filter((t): t is Tag => t !== undefined)

  if (totalCount === 0) {
    return <EmptyState icon={<Bookmark />} title="아직 저장한 링크가 없어요" description="위 입력창에 링크를 붙여 넣으면 바로 저장돼요" />
  }
  if (links.length === 0) {
    return (
      <EmptyState
        icon={<Search />}
        title="조건에 맞는 링크가 없어요"
        action={<Button variant="outline" onClick={resetFilter}>필터 초기화</Button>}
      />
    )
  }
  if (isDesktop) {
    return (
      <div className="grid grid-cols-2 gap-4 py-6 lg:grid-cols-3">
        {links.map((link) => (
          <LinkCard key={link.id} link={link} tags={tagsOf(link)} />
        ))}
      </div>
    )
  }
  return (
    <ul className="divide-y py-2">
      {links.map((link) => (
        <LinkRow key={link.id} link={link} tags={tagsOf(link)} />
      ))}
    </ul>
  )
}
