import { describe, expect, it, vi } from 'vitest'
import { saveSettings } from '@/lib/settings'
import { fetchMetadata } from './fetchMetadata'

describe('fetchMetadata', () => {
  it('URL을 인코딩해 /api/metadata를 호출하고 네 필드를 정규화한다', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'T', description: 'D', image: 'https://i/x.png', siteName: 'S' }), { status: 200 }))
    const result = await fetchMetadata('https://e.com/a?b=1&c=2', undefined, fetchImpl as unknown as typeof fetch)
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/metadata?url=https%3A%2F%2Fe.com%2Fa%3Fb%3D1%26c%3D2')
    expect(result).toEqual({ title: 'T', description: 'D', image: 'https://i/x.png', siteName: 'S' })
  })
  it('실패나 비정상 응답은 null', async () => {
    expect(await fetchMetadata('https://e.com', undefined, vi.fn().mockResolvedValue(new Response('', { status: 502 })) as unknown as typeof fetch)).toBeNull()
    expect(await fetchMetadata('https://e.com', undefined, vi.fn().mockRejectedValue(new TypeError('net')) as unknown as typeof fetch)).toBeNull()
  })
  it('필드 타입이 틀리면 빈 값으로 채운다', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 1, image: 2 }), { status: 200 }))
    expect(await fetchMetadata('https://e.com', undefined, fetchImpl as unknown as typeof fetch)).toEqual({ title: '', description: '', image: null, siteName: '' })
  })

  it('저장된 토큰이 있으면 Authorization 헤더로 보낸다', async () => {
    saveSettings({ owner: 'me', repo: 'r', path: 'links.json', token: 'tok-1', theme: 'system' })
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    await fetchMetadata('https://e.com', undefined, fetchImpl as unknown as typeof fetch)
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(init.headers).toEqual({ Authorization: 'Bearer tok-1' })
  })
})
