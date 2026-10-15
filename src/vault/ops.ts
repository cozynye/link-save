import { TAG_COLORS, type Link, type Tag, type TagColor, type Vault } from './schema'

export type LinkPatch = Partial<Omit<Link, 'id' | 'createdAt' | 'updatedAt'>>
export type TagPatch = Partial<Pick<Tag, 'name' | 'color'>>

export type Op =
  | { type: 'addLink'; link: Link }
  | { type: 'updateLink'; id: string; patch: LinkPatch; now: string }
  | { type: 'deleteLink'; id: string }
  | { type: 'addTag'; tag: Tag }
  | { type: 'updateTag'; id: string; patch: TagPatch }
  | { type: 'deleteTag'; id: string }

export function applyOp(vault: Vault, op: Op): Vault {
  switch (op.type) {
    case 'addLink':
      if (vault.links.some((l) => l.id === op.link.id)) return vault
      return { ...vault, links: [op.link, ...vault.links] }
    case 'updateLink':
      return {
        ...vault,
        links: vault.links.map((l) =>
          l.id === op.id ? { ...l, ...op.patch, id: l.id, createdAt: l.createdAt, updatedAt: op.now } : l,
        ),
      }
    case 'deleteLink':
      return { ...vault, links: vault.links.filter((l) => l.id !== op.id) }
    case 'addTag':
      if (vault.tags.some((t) => t.id === op.tag.id)) return vault
      return { ...vault, tags: [...vault.tags, op.tag] }
    case 'updateTag':
      return { ...vault, tags: vault.tags.map((t) => (t.id === op.id ? { ...t, ...op.patch, id: t.id } : t)) }
    case 'deleteTag':
      return {
        ...vault,
        tags: vault.tags.filter((t) => t.id !== op.id),
        links: vault.links.map((l) => (l.tags.includes(op.id) ? { ...l, tags: l.tags.filter((id) => id !== op.id) } : l)),
      }
  }
}

export function applyOps(vault: Vault, ops: readonly Op[]): Vault {
  return ops.reduce(applyOp, vault)
}

export function commitMessage(op: Op, before: Vault): string {
  switch (op.type) {
    case 'addLink':
      return `Add link: ${op.link.title}`
    case 'updateLink': {
      const current = before.links.find((l) => l.id === op.id)?.title ?? op.id
      const keys = Object.keys(op.patch)
      if (keys.length === 1 && keys[0] === 'pinned') return `${op.patch.pinned ? 'Pin' : 'Unpin'} link: ${current}`
      return `Update link: ${op.patch.title ?? current}`
    }
    case 'deleteLink':
      return `Delete link: ${before.links.find((l) => l.id === op.id)?.title ?? op.id}`
    case 'addTag':
      return `Add tag: ${op.tag.name}`
    case 'updateTag':
      return `Update tag: ${before.tags.find((t) => t.id === op.id)?.name ?? op.id}`
    case 'deleteTag':
      return `Delete tag: ${before.tags.find((t) => t.id === op.id)?.name ?? op.id}`
  }
}

export function findLinkByUrl(vault: Vault, url: string, excludeId?: string): Link | undefined {
  return vault.links.find((l) => l.url === url && l.id !== excludeId)
}

export function normalizeTagName(name: string): string {
  return name.trim().toLocaleLowerCase()
}

export function findTagByName(vault: Vault, name: string): Tag | undefined {
  const target = normalizeTagName(name)
  return vault.tags.find((t) => normalizeTagName(t.name) === target)
}

export function pickTagColor(vault: Vault): TagColor {
  const counts = new Map<TagColor, number>(TAG_COLORS.map((c) => [c, 0]))
  for (const tag of vault.tags) counts.set(tag.color, (counts.get(tag.color) ?? 0) + 1)
  let best: TagColor = TAG_COLORS[0]
  for (const color of TAG_COLORS) {
    if ((counts.get(color) ?? 0) < (counts.get(best) ?? 0)) best = color
  }
  return best
}
