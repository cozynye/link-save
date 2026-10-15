import { describe, expect, it, vi } from 'vitest'
import {
  GithubAuthError,
  GithubConflictError,
  GithubError,
  GithubNotFoundError,
  GithubOversizeError,
  GithubVaultClient,
  decodeBase64Utf8,
  encodeBase64Utf8,
} from './github'

const ref = { owner: 'me', repo: 'save-link-data', path: 'links.json' }
const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('base64 utf8', () => {
  it('한글과 이모지를 왕복한다', () => {
    const text = '{"title":"한글 제목 🚀 — ünïcode"}\n'
    expect(decodeBase64Utf8(encodeBase64Utf8(text))).toBe(text)
  })
  it('GitHub가 넣는 줄바꿈을 무시한다', () => {
    const b64 = encodeBase64Utf8('abcdefghij'.repeat(10))
    const wrapped = b64.replace(/(.{60})/g, '$1\n')
    expect(decodeBase64Utf8(wrapped)).toBe('abcdefghij'.repeat(10))
  })
  it('큰 문자열도 처리한다', () => {
    const big = 'x'.repeat(300_000)
    expect(decodeBase64Utf8(encodeBase64Utf8(big))).toBe(big)
  })
})

describe('GithubVaultClient.readFile', () => {
  it('헤더와 URL을 올바르게 보내고 내용과 sha를 돌려준다', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { content: encodeBase64Utf8('{"a":1}'), sha: 'abc', size: 7 }))
    const client = new GithubVaultClient(ref, 'tok', fetchImpl)
    const result = await client.readFile()
    expect(result).toEqual({ text: '{"a":1}', sha: 'abc' })
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.github.com/repos/me/save-link-data/contents/links.json')
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer tok',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    })
    expect(init.cache).toBe('no-store')
  })
  it('401/403은 GithubAuthError', async () => {
    const client = new GithubVaultClient(ref, 'tok', vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Bad credentials' })))
    await expect(client.readFile()).rejects.toBeInstanceOf(GithubAuthError)
  })
  it('404는 GithubNotFoundError', async () => {
    const client = new GithubVaultClient(ref, 'tok', vi.fn().mockResolvedValue(jsonResponse(404, {})))
    await expect(client.readFile()).rejects.toBeInstanceOf(GithubNotFoundError)
  })
  it('1MB 초과로 content가 비면 GithubOversizeError', async () => {
    const client = new GithubVaultClient(ref, 'tok', vi.fn().mockResolvedValue(jsonResponse(200, { content: '', sha: 'x', size: 2_000_000, encoding: 'none' })))
    await expect(client.readFile()).rejects.toBeInstanceOf(GithubOversizeError)
  })
  it('그 외 상태는 GithubError에 status를 담는다', async () => {
    const client = new GithubVaultClient(ref, 'tok', vi.fn().mockResolvedValue(jsonResponse(500, {})))
    await expect(client.readFile()).rejects.toMatchObject({ status: 500 })
    await expect(client.readFile()).rejects.toBeInstanceOf(GithubError)
  })
})

describe('GithubVaultClient.writeFile', () => {
  it('PUT 본문에 message, base64 content, sha를 넣고 새 sha를 돌려준다', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { content: { sha: 'new' } }))
    const client = new GithubVaultClient(ref, 'tok', fetchImpl)
    const result = await client.writeFile('{"b":2}\n', 'Add link: x', 'old')
    expect(result).toEqual({ sha: 'new' })
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body as string)).toEqual({ message: 'Add link: x', content: encodeBase64Utf8('{"b":2}\n'), sha: 'old' })
  })
  it('sha가 null이면 본문에서 생략한다(초기 생성)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(201, { content: { sha: 'first' } }))
    const client = new GithubVaultClient(ref, 'tok', fetchImpl)
    await client.writeFile('{}\n', 'Initialize vault', null)
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('sha')
  })
  it('409는 GithubConflictError', async () => {
    const client = new GithubVaultClient(ref, 'tok', vi.fn().mockResolvedValue(jsonResponse(409, {})))
    await expect(client.writeFile('x', 'm', 'old')).rejects.toBeInstanceOf(GithubConflictError)
  })
  it('sha 없이 썼는데 422면 이미 파일이 있다는 뜻이므로 GithubConflictError', async () => {
    const client = new GithubVaultClient(ref, 'tok', vi.fn().mockResolvedValue(jsonResponse(422, {})))
    await expect(client.writeFile('x', 'm', null)).rejects.toBeInstanceOf(GithubConflictError)
  })
  it('403은 GithubAuthError', async () => {
    const client = new GithubVaultClient(ref, 'tok', vi.fn().mockResolvedValue(jsonResponse(403, {})))
    await expect(client.writeFile('x', 'm', 'old')).rejects.toBeInstanceOf(GithubAuthError)
  })
})
