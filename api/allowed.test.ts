// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { verifyOwner } from './_owner.js'
import { GET } from './allowed'

vi.mock('./_owner.js', () => ({ verifyOwner: vi.fn() }))
const mocked = vi.mocked(verifyOwner)
afterEach(() => mocked.mockReset())

const req = () => new Request('https://app.example/api/allowed', { headers: { authorization: 'Bearer t' } })

describe('GET /api/allowed', () => {
  it('허용되면 200과 login, 캐시하지 않는다', async () => {
    mocked.mockResolvedValue({ ok: true, login: 'cozynye' })
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(await res.json()).toEqual({ login: 'cozynye' })
  })
  it('거절 상태를 그대로 돌려준다', async () => {
    mocked.mockResolvedValue({ ok: false, status: 403, error: 'not allowed' })
    const res = await GET(req())
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'not allowed' })
  })
})
