import { describe, expect, it } from 'vitest'
import { applyOp, applyOps, commitMessage, findLinkByUrl, findTagByName, pickTagColor, type Op } from './ops'
import { emptyVault, type Link, type Tag, type Vault } from './schema'

const tagAi: Tag = { id: 'tagai0', name: 'AI', color: 'violet' }
const tagCss: Tag = { id: 'tagcss', name: 'CSS', color: 'pink' }
const link = (over: Partial<Link> = {}): Link => ({
  id: 'link-1',
  url: 'https://example.com/a',
  title: '첫 글',
  description: '',
  note: '',
  image: null,
  siteName: 'example.com',
  tags: ['tagai0'],
  pinned: false,
  createdAt: '2026-10-14T00:00:00.000Z',
  updatedAt: '2026-10-14T00:00:00.000Z',
  ...over,
})
const base: Vault = { version: 1, tags: [tagAi, tagCss], links: [link()] }

describe('applyOp', () => {
  it('addLink는 앞에 추가하고 같은 id는 무시한다', () => {
    const next = applyOp(base, { type: 'addLink', link: link({ id: 'link-2', title: '둘째' }) })
    expect(next.links.map((l) => l.id)).toEqual(['link-2', 'link-1'])
    expect(applyOp(next, { type: 'addLink', link: link({ id: 'link-2' }) })).toBe(next)
    expect(base.links).toHaveLength(1)
  })
  it('updateLink는 병합하고 updatedAt을 now로 바꾸며 id와 createdAt은 보호한다', () => {
    const next = applyOp(base, {
      type: 'updateLink',
      id: 'link-1',
      patch: { note: '메모', pinned: true, title: '수정' },
      now: '2026-10-15T00:00:00.000Z',
    })
    expect(next.links[0]).toMatchObject({ id: 'link-1', note: '메모', pinned: true, title: '수정', createdAt: '2026-10-14T00:00:00.000Z', updatedAt: '2026-10-15T00:00:00.000Z' })
  })
  it('deleteLink는 제거한다', () => {
    expect(applyOp(base, { type: 'deleteLink', id: 'link-1' }).links).toEqual([])
  })
  it('addTag는 뒤에 추가하고 같은 id는 무시한다', () => {
    const next = applyOp(base, { type: 'addTag', tag: { id: 'tagnew', name: 'New', color: 'red' } })
    expect(next.tags.map((t) => t.id)).toEqual(['tagai0', 'tagcss', 'tagnew'])
  })
  it('updateTag는 이름과 색만 바꾼다', () => {
    const next = applyOp(base, { type: 'updateTag', id: 'tagai0', patch: { name: '인공지능', color: 'blue' } })
    expect(next.tags[0]).toEqual({ id: 'tagai0', name: '인공지능', color: 'blue' })
  })
  it('deleteTag는 태그와 모든 링크의 참조를 함께 제거한다', () => {
    const next = applyOp(base, { type: 'deleteTag', id: 'tagai0' })
    expect(next.tags.map((t) => t.id)).toEqual(['tagcss'])
    expect(next.links[0].tags).toEqual([])
  })
  it('applyOps는 순서대로 적용한다', () => {
    const ops: Op[] = [
      { type: 'addLink', link: link({ id: 'link-2' }) },
      { type: 'deleteLink', id: 'link-1' },
    ]
    expect(applyOps(base, ops).links.map((l) => l.id)).toEqual(['link-2'])
  })
})

describe('commitMessage', () => {
  it('연산별 메시지를 만든다', () => {
    expect(commitMessage({ type: 'addLink', link: link({ title: '새 글' }) }, base)).toBe('Add link: 새 글')
    expect(commitMessage({ type: 'updateLink', id: 'link-1', patch: { note: 'x' }, now: 'n' }, base)).toBe('Update link: 첫 글')
    expect(commitMessage({ type: 'updateLink', id: 'link-1', patch: { title: '바뀜' }, now: 'n' }, base)).toBe('Update link: 바뀜')
    expect(commitMessage({ type: 'updateLink', id: 'link-1', patch: { pinned: true }, now: 'n' }, base)).toBe('Pin link: 첫 글')
    expect(commitMessage({ type: 'updateLink', id: 'link-1', patch: { pinned: false }, now: 'n' }, base)).toBe('Unpin link: 첫 글')
    expect(commitMessage({ type: 'deleteLink', id: 'link-1' }, base)).toBe('Delete link: 첫 글')
    expect(commitMessage({ type: 'addTag', tag: tagCss }, base)).toBe('Add tag: CSS')
    expect(commitMessage({ type: 'updateTag', id: 'tagai0', patch: { color: 'red' } }, base)).toBe('Update tag: AI')
    expect(commitMessage({ type: 'deleteTag', id: 'tagcss' }, base)).toBe('Delete tag: CSS')
  })
})

describe('lookups', () => {
  it('findLinkByUrl은 자기 자신을 제외할 수 있다', () => {
    expect(findLinkByUrl(base, 'https://example.com/a')?.id).toBe('link-1')
    expect(findLinkByUrl(base, 'https://example.com/a', 'link-1')).toBeUndefined()
  })
  it('findTagByName은 대소문자와 공백을 무시한다', () => {
    expect(findTagByName(base, '  ai ')?.id).toBe('tagai0')
    expect(findTagByName(base, 'React')).toBeUndefined()
  })
  it('pickTagColor는 가장 적게 쓰인 색을 순서대로 고른다', () => {
    expect(pickTagColor(emptyVault())).toBe('red')
    expect(pickTagColor(base)).toBe('red')
    const allButPink: Vault = {
      ...emptyVault(),
      tags: ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'indigo', 'violet'].map((c, i) => ({ id: `t${i}`, name: `t${i}`, color: c as Tag['color'] })),
    }
    expect(pickTagColor(allButPink)).toBe('pink')
  })
})
