import type { Link } from '@/vault/schema'

export interface LinkFilter {
  query: string
  tagIds: string[]
  pinnedOnly: boolean
}

export const EMPTY_FILTER: LinkFilter = { query: '', tagIds: [], pinnedOnly: false }

export function filterLinks(links: readonly Link[], filter: LinkFilter): Link[] {
  const tokens = filter.query.toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return links.filter((link) => {
    if (filter.pinnedOnly && !link.pinned) return false
    if (filter.tagIds.length > 0 && !link.tags.some((id) => filter.tagIds.includes(id))) return false
    if (tokens.length === 0) return true
    const haystack = `${link.title}\n${link.url}\n${link.note}\n${link.description}\n${link.siteName}`.toLocaleLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
}
