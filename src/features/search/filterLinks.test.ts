import { describe, expect, it } from 'vitest'
import type { Link } from '@/vault/schema'
import { EMPTY_FILTER, filterLinks } from './filterLinks'

const mk = (id: string, over: Partial<Link>): Link => ({
  id, url: `https://example.com/${id}`, title: id, description: '', note: '', image: null, siteName: 'example.com',
  tags: [], pinned: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...over,
})
const links = [
  mk('a', { title: 'React Query 가이드', tags: ['t1'], note: '캐시 전략' }),
  mk('b', { title: 'CSS Grid', tags: ['t2'], pinned: true, description: '레이아웃' }),
  mk('c', { title: '기타', tags: ['t1', 't2'], siteName: 'blog.dev' }),
]

describe('filterLinks', () => {
  it('빈 필터는 전부 돌려준다', () => {
    expect(filterLinks(links, EMPTY_FILTER)).toHaveLength(3)
  })
  it('태그는 OR로 합친다', () => {
    expect(filterLinks(links, { ...EMPTY_FILTER, tagIds: ['t2'] }).map((l) => l.id)).toEqual(['b', 'c'])
    expect(filterLinks(links, { ...EMPTY_FILTER, tagIds: ['t1', 't2'] })).toHaveLength(3)
  })
  it('고정만 보기', () => {
    expect(filterLinks(links, { ...EMPTY_FILTER, pinnedOnly: true }).map((l) => l.id)).toEqual(['b'])
  })
  it('검색은 토큰 전부가 제목·URL·노트·설명·사이트명 어딘가에 있어야 한다', () => {
    expect(filterLinks(links, { ...EMPTY_FILTER, query: 'react 캐시' }).map((l) => l.id)).toEqual(['a'])
    expect(filterLinks(links, { ...EMPTY_FILTER, query: '레이아웃' }).map((l) => l.id)).toEqual(['b'])
    expect(filterLinks(links, { ...EMPTY_FILTER, query: 'blog.dev' }).map((l) => l.id)).toEqual(['c'])
    expect(filterLinks(links, { ...EMPTY_FILTER, query: 'react grid' })).toEqual([])
  })
})
