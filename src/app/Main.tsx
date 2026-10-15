import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { LinkGrid } from '@/features/links/LinkGrid'
import { UrlInput } from '@/features/links/UrlInput'
import { filterLinks } from '@/features/search/filterLinks'
import { SearchBar } from '@/features/search/SearchBar'
import { SortMenu } from '@/features/search/SortMenu'
import { sortLinks } from '@/features/search/sortLinks'
import { TagChipRow } from '@/features/tags/TagChipRow'
import { TagSidebar } from '@/features/tags/TagSidebar'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { useUiStore } from '@/lib/uiStore'
import { useVaultStore } from '@/vault/store'
import { Header } from './Header'
import { StatusBanner } from './StatusBanner'

function GridSkeleton() {
  return (
    <div className="grid gap-4 py-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl md:h-64" />
      ))}
    </div>
  )
}

export function Main() {
  const vault = useVaultStore((s) => s.vault)
  const filter = useUiStore((s) => s.filter)
  const sort = useUiStore((s) => s.sort)
  const isDesktop = useIsDesktop()
  const links = useMemo(() => (vault ? sortLinks(filterLinks(vault.links, filter), sort) : []), [vault, filter, sort])

  return (
    <div className="min-h-dvh">
      <Header />
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 pb-24 md:px-6">
        {isDesktop && vault && <TagSidebar vault={vault} />}
        <main className="min-w-0 flex-1 pt-4 md:pt-6">
          <StatusBanner />
          <section className="flex flex-col gap-3">
            <UrlInput />
            <div className="flex items-center gap-2">
              <SearchBar />
              <SortMenu />
            </div>
            {!isDesktop && vault && <TagChipRow vault={vault} />}
          </section>
          {vault ? <LinkGrid links={links} totalCount={vault.links.length} /> : <GridSkeleton />}
        </main>
      </div>
    </div>
  )
}
