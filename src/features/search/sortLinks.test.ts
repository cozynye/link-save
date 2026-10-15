import { describe, expect, it } from 'vitest'
import type { Link } from '@/vault/schema'
import { SORT_LABELS, sortLinks } from './sortLinks'

const mk = (id: string, createdAt: string, title: string, pinned = false): Link => ({
  id, url: `https://e.com/${id}`, title, description: '', note: '', image: null, siteName: '', tags: [], pinned, createdAt, updatedAt: createdAt,
})
const links = [
  mk('old', '2025-01-01T00:00:00.000Z', '나'),
  mk('new', '2026-06-01T00:00:00.000Z', '가'),
  mk('pin', '2024-01-01T00:00:00.000Z', '다', true),
]

describe('sortLinks', () => {
  it('고정은 항상 먼저, 최신순', () => {
    expect(sortLinks(links, 'newest').map((l) => l.id)).toEqual(['pin', 'new', 'old'])
  })
  it('오래된순', () => {
    expect(sortLinks(links, 'oldest').map((l) => l.id)).toEqual(['pin', 'old', 'new'])
  })
  it('제목순은 한국어 정렬', () => {
    expect(sortLinks(links, 'title').map((l) => l.id)).toEqual(['pin', 'new', 'old'])
  })
  it('원본을 바꾸지 않는다', () => {
    sortLinks(links, 'newest')
    expect(links[0].id).toBe('old')
  })
  it('라벨', () => {
    expect(SORT_LABELS).toEqual({ newest: '최신순', oldest: '오래된순', title: '제목순' })
  })
})
