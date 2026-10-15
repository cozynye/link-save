import type { Tag, Vault } from './schema'

export function tagCounts(vault: Vault): Map<string, number> {
  const known = new Set(vault.tags.map((t) => t.id))
  const counts = new Map<string, number>()
  for (const link of vault.links) {
    for (const id of link.tags) {
      if (known.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }
  return counts
}

export function pinnedCount(vault: Vault): number {
  return vault.links.filter((l) => l.pinned).length
}

export function orderedTags(vault: Vault, recentWindow = 20): Tag[] {
  const byId = new Map(vault.tags.map((t) => [t.id, t]))
  const recentLinks = [...vault.links].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, recentWindow)
  const recentIds: string[] = []
  for (const link of recentLinks) {
    for (const id of link.tags) {
      if (byId.has(id) && !recentIds.includes(id)) recentIds.push(id)
    }
  }
  const counts = tagCounts(vault)
  const rest = vault.tags
    .filter((t) => !recentIds.includes(t.id))
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name, 'ko'))
  return [...recentIds.map((id) => byId.get(id)!), ...rest]
}
