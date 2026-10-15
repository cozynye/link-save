// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ALLOWED_GITHUB_LOGINS, bearerToken, clearOwnerCacheForTests, isAllowedLogin, verifyOwner } from './_owner'

const req = (auth?: string) => new Request('https://app.example/api/allowed', { headers: auth ? { authorization: auth } : {} })
const userResponse = (login: string) => new Response(JSON.stringify({ login }), { status: 200 })

beforeEach(() => clearOwnerCacheForTests())

describe('허용 목록', () => {
  it('cozynye가 들어 있고 대소문자를 무시한다', () => {
    expect(ALLOWED_GITHUB_LOGINS).toContain('cozynye')
    expect(isAllowedLogin('CozyNye')).toBe(true)
    expect(isAllowedLogin('someone-else')).toBe(false)
  })
  it('Bearer 토큰만 꺼낸다', () => {
    expect(bearerToken(req('Bearer github_pat_abc'))).toBe('github_pat_abc')
    expect(bearerToken(req('bearer  tok '))).toBe('tok')
    expect(bearerToken(req('Basic xyz'))).toBeNull()
    expect(bearerToken(req())).toBeNull()
  })
})

describe('verifyOwner', () => {
  it('토큰이 없으면 401이고 GitHub를 부르지 않는다', async () => {
    const fetchImpl = vi.fn()
    expect(await verifyOwner(req(), fetchImpl as unknown as typeof fetch)).toEqual({ ok: false, status: 401, error: 'token required' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
  it('허용된 계정이면 ok, 토큰을 GitHub /user에 보낸다', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(userResponse('cozynye'))
    expect(await verifyOwner(req('Bearer t1'), fetchImpl as unknown as typeof fetch)).toEqual({ ok: true, login: 'cozynye' })
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.github.com/user')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer t1' })
  })
  it('다른 계정이면 403', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(userResponse('stranger'))
    expect(await verifyOwner(req('Bearer t2'), fetchImpl as unknown as typeof fetch)).toEqual({ ok: false, status: 403, error: 'not allowed' })
  })
  it('GitHub가 401이면 401, 그 외 실패와 네트워크 오류는 502', async () => {
    expect(await verifyOwner(req('Bearer bad'), vi.fn().mockResolvedValue(new Response('', { status: 401 })) as unknown as typeof fetch)).toMatchObject({ ok: false, status: 401 })
    expect(await verifyOwner(req('Bearer t3'), vi.fn().mockResolvedValue(new Response('', { status: 500 })) as unknown as typeof fetch)).toMatchObject({ ok: false, status: 502 })
    expect(await verifyOwner(req('Bearer t4'), vi.fn().mockRejectedValue(new TypeError('net')) as unknown as typeof fetch)).toMatchObject({ ok: false, status: 502 })
  })
  it('같은 토큰은 10분 동안 캐시하고, 지나면 다시 확인한다', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => userResponse('stranger'))
    const f = fetchImpl as unknown as typeof fetch
    await verifyOwner(req('Bearer same'), f, 0)
    await verifyOwner(req('Bearer same'), f, 9 * 60 * 1000)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await verifyOwner(req('Bearer same'), f, 11 * 60 * 1000)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
  it('실패한 확인(401)은 캐시하지 않는다', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('', { status: 401 })).mockResolvedValueOnce(userResponse('cozynye'))
    const f = fetchImpl as unknown as typeof fetch
    expect((await verifyOwner(req('Bearer x'), f)).ok).toBe(false)
    expect((await verifyOwner(req('Bearer x'), f)).ok).toBe(true)
  })
})
