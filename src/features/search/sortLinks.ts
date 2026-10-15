import type { Link } from '@/vault/schema'

export type SortKey = 'newest' | 'oldest' | 'title'

export const SORT_LABELS: Record<SortKey, string> = { newest: '최신순', oldest: '오래된순', title: '제목순' }
export const SORT_KEYS: SortKey[] = ['newest', 'oldest', 'title']

const collator = new Intl.Collator('ko')

export function sortLinks(links: readonly Link[], sort: SortKey): Link[] {
  return [...links].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    switch (sort) {
      case 'newest':
        return b.createdAt.localeCompare(a.createdAt)
      case 'oldest':
        return a.createdAt.localeCompare(b.createdAt)
      case 'title':
        return collator.compare(a.title, b.title)
    }
  })
}
