import { describe, expect, it } from 'vitest'
import { TAG_COLORS, emptyVault, newLinkId, newTagId, parseVault, serializeVault, type Vault } from './schema'

const sample: Vault = {
  version: 1,
  tags: [{ id: 'k3f9a2', name: 'AI', color: 'violet' }],
  links: [
    {
      id: '6f1c2a7e-3b4d-4c2e-9a1f-0d8e7b6c5a43',
      url: 'https://example.com/post',
      title: '제목',
      description: '설명',
      note: '메모',
      image: 'https://example.com/og.png',
      siteName: 'example.com',
      tags: ['k3f9a2'],
      pinned: false,
      createdAt: '2026-10-14T09:00:00.000Z',
      updatedAt: '2026-10-14T09:00:00.000Z',
    },
  ],
}

describe('schema', () => {
  it('열두 색을 순서대로 정의한다', () => {
    expect(TAG_COLORS).toEqual(['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'pink'])
  })

  it('emptyVault는 유효하다', () => {
    const result = parseVault(serializeVault(emptyVault()))
    expect(result.ok).toBe(true)
  })

  it('serializeVault는 2칸 들여쓰기와 끝 줄바꿈을 쓴다', () => {
    const text = serializeVault(sample)
    expect(text.endsWith('}\n')).toBe(true)
    expect(text.split('\n')[1]).toBe('  "version": 1,')
  })

  it('왕복이 보존된다', () => {
    const result = parseVault(serializeVault(sample))
    expect(result).toEqual({ ok: true, vault: sample })
  })

  it('JSON이 깨지면 invalid-json', () => {
    expect(parseVault('{ not json')).toEqual({ ok: false, reason: 'invalid-json' })
  })

  it('지원하지 않는 version은 unsupported-version', () => {
    const result = parseVault(JSON.stringify({ ...sample, version: 2 }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('unsupported-version')
  })

  it('필드가 빠지면 invalid-shape와 상세를 돌려준다', () => {
    const broken = { ...sample, links: [{ ...sample.links[0], title: '' }] }
    const result = parseVault(JSON.stringify(broken))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('invalid-shape')
      expect(result.detail).toContain('links.0.title')
    }
  })

  it('image는 null을 허용하고 잘못된 URL은 거절한다', () => {
    const okResult = parseVault(JSON.stringify({ ...sample, links: [{ ...sample.links[0], image: null }] }))
    expect(okResult.ok).toBe(true)
    const bad = parseVault(JSON.stringify({ ...sample, links: [{ ...sample.links[0], image: 'not a url' }] }))
    expect(bad.ok).toBe(false)
  })

  it('id 생성기는 형식을 지킨다', () => {
    expect(newLinkId()).toMatch(/^[0-9a-f-]{36}$/)
    expect(newTagId()).toMatch(/^[a-z0-9]{6}$/)
    expect(newTagId()).not.toBe(newTagId())
  })
})
