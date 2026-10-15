import { describe, expect, it } from 'vitest'
import { orderedTags, pinnedCount, tagCounts } from './derive'
import type { Link, Tag, Vault } from './schema'

const tags: Tag[] = [
  { id: 'a', name: 'A', color: 'red' },
  { id: 'b', name: 'B', color: 'blue' },
  { id: 'c', name: 'C', color: 'teal' },
]
const mk = (id: string, createdAt: string, tagIds: string[], pinned = false): Link => ({
  id, url: `https://e.com/${id}`, title: id, description: '', note: '', image: null, siteName: '', tags: tagIds, pinned, createdAt, updatedAt: createdAt,
})
const vault: Vault = {
  version: 1,
  tags,
  links: [
    mk('1', '2026-01-01T00:00:00.000Z', ['a'], true),
    mk('2', '2026-01-02T00:00:00.000Z', ['a', 'b']),
    mk('3', '2026-01-03T00:00:00.000Z', ['c', 'ghost']),
  ],
}

describe('derive', () => {
  it('tagCounts는 존재하는 태그만 센다', () => {
    const counts = tagCounts(vault)
    expect(counts.get('a')).toBe(2)
    expect(counts.get('b')).toBe(1)
    expect(counts.get('c')).toBe(1)
    expect(counts.has('ghost')).toBe(false)
  })
  it('pinnedCount', () => {
    expect(pinnedCount(vault)).toBe(1)
  })
  it('orderedTags는 최근 링크의 태그를 먼저, 그 안에서는 더 최근 링크 순, 나머지는 사용 횟수 순', () => {
    expect(orderedTags(vault).map((t) => t.id)).toEqual(['c', 'a', 'b'])
    expect(orderedTags(vault, 1).map((t) => t.id)).toEqual(['c', 'a', 'b'])
    const noLinks: Vault = { ...vault, links: [] }
    expect(orderedTags(noLinks).map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })
})
