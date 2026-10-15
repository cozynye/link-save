import { describe, expect, it, vi } from 'vitest'
import { checkOwner } from './ownerCheck'

describe('checkOwner', () => {
  it('토큰을 Bearer로 보내고 200이면 allowed', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    expect(await checkOwner('tok', fetchImpl as unknown as typeof fetch)).toBe('allowed')
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/allowed')
    expect(init.headers).toEqual({ Authorization: 'Bearer tok' })
  })
  it('200이 아니면 모두 denied (403, 401, 404, 500)', async () => {
    for (const status of [403, 401, 404, 500]) {
      expect(await checkOwner('t', vi.fn().mockResolvedValue(new Response('', { status })) as unknown as typeof fetch)).toBe('denied')
    }
  })
  it('네트워크 오류는 unreachable', async () => {
    expect(await checkOwner('t', vi.fn().mockRejectedValue(new TypeError('net')) as unknown as typeof fetch)).toBe('unreachable')
  })
})
