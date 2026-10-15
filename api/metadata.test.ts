// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyOwner } from './_owner.js'
import { GET, decodeEntities, detectCharset, extractMetadata, fetchHtml, isAllowedOrigin, isPrivateHost } from './metadata'

vi.mock('./_owner.js', () => ({ verifyOwner: vi.fn() }))
const mockedOwner = vi.mocked(verifyOwner)

const html = (body: string) => new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('isPrivateHost', () => {
  it('루프백, 사설, 링크 로컬, 메타데이터 주소를 막는다', () => {
    for (const h of ['localhost', 'LOCALHOST', 'foo.localhost', '127.0.0.1', '127.8.8.8', '0.0.0.0', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.0.1', '169.254.169.254', '100.64.0.1', '::1', '[::1]', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) {
      expect(isPrivateHost(h), h).toBe(true)
    }
  })
  it('공개 호스트는 허용한다', () => {
    for (const h of ['example.com', '8.8.8.8', '172.32.0.1', '2606:4700::1111']) expect(isPrivateHost(h), h).toBe(false)
  })
  it('IPv6 정규화 우회(매핑·호환·NAT64·fe80~febf·fec0~feff)를 막는다', () => {
    for (const h of [
      '[::ffff:7f00:1]', // new URL() 정규화 후의 ::ffff:127.0.0.1
      '[::ffff:a9fe:a9fe]', // 169.254.169.254
      'localhost.', // 끝에 점이 붙은 FQDN
      '[::7f00:1]', // IPv4-호환(구식) 표기의 127.0.0.1
      '[64:ff9b::a00:1]', // NAT64의 10.0.0.1
      '[fec0::1]', // 구식 site-local
      '[febf::1]', // fe80::/10의 상단 경계
      '[fe80::1]', // link-local
    ]) {
      expect(isPrivateHost(h), h).toBe(true)
    }
  })
  it('예약된 IPv4 대역(198.18/15, 192.0.0/24, 224.0.0.0/4 이상)을 막는다', () => {
    for (const h of ['198.18.0.1', '198.19.255.255', '192.0.0.5', '224.0.0.1', '240.0.0.1', '255.255.255.255']) {
      expect(isPrivateHost(h), h).toBe(true)
    }
  })
  it('예약 대역 경계 바로 바깥의 공개 주소는 허용한다', () => {
    for (const h of ['198.17.255.255', '198.20.0.1', '223.255.255.255', '192.0.1.1', '2606:4700::1111']) {
      expect(isPrivateHost(h), h).toBe(false)
    }
  })
})

describe('isAllowedOrigin', () => {
  const mk = (headers: Record<string, string>) => new Request('https://app.example/api/metadata?url=x', { headers })
  it('Sec-Fetch-Site가 있으면 same-origin만 허용', () => {
    expect(isAllowedOrigin(mk({ 'sec-fetch-site': 'same-origin' }))).toBe(true)
    expect(isAllowedOrigin(mk({ 'sec-fetch-site': 'cross-site', referer: 'https://app.example/' }))).toBe(false)
  })
  it('헤더가 없으면 Origin 또는 Referer 호스트가 같아야 한다', () => {
    expect(isAllowedOrigin(mk({ referer: 'https://app.example/?x=1' }))).toBe(true)
    expect(isAllowedOrigin(mk({ origin: 'https://evil.example' }))).toBe(false)
    expect(isAllowedOrigin(mk({}))).toBe(false)
    expect(isAllowedOrigin(mk({ referer: 'http://localhost:5173/' }))).toBe(true)
  })
})

describe('decodeEntities', () => {
  it('명명·10진·16진 엔티티를 푼다', () => {
    expect(decodeEntities('A &amp; B &lt;c&gt; &quot;d&quot; &#39;e&#39; &#x1F680; &hellip; &unknown;')).toBe('A & B <c> "d" \'e\' 🚀 … &unknown;')
  })
})

describe('extractMetadata', () => {
  it('og 우선, 속성 순서 무관, 상대·프로토콜 상대 이미지 절대화', () => {
    const doc = `<html><head>
      <title>Fallback &amp; Title</title>
      <meta content="OG 제목" property="og:title">
      <meta name="description" content="일반 설명">
      <meta property='og:description' content='OG 설명'>
      <meta property="og:image" content="//cdn.example.com/a.png">
      <meta property="og:site_name" content="Example Site">
    </head><body></body></html>`
    expect(extractMetadata(doc, 'https://www.example.com/post')).toEqual({
      title: 'OG 제목', description: 'OG 설명', image: 'https://cdn.example.com/a.png', siteName: 'Example Site',
    })
  })
  it('og가 없으면 twitter, 그 다음 title/description, 사이트명은 www. 뗀 호스트', () => {
    const doc = `<head><title>  제목
      줄바꿈 </title><meta name="twitter:description" content="트위터 설명"><meta name="twitter:image" content="/img.png"></head>`
    expect(extractMetadata(doc, 'https://www.blog.dev/x/y')).toEqual({
      title: '제목 줄바꿈', description: '트위터 설명', image: 'https://www.blog.dev/img.png', siteName: 'blog.dev',
    })
  })
  it('이미지 URL이 http(s)가 아니거나 비어 있으면 null', () => {
    expect(extractMetadata('<meta property="og:image" content="data:image/png;base64,xx">', 'https://e.com/').image).toBeNull()
    expect(extractMetadata('<title>t</title>', 'https://e.com/').image).toBeNull()
  })
})

describe('detectCharset', () => {
  it('헤더, 메타, 기본값 순서', () => {
    expect(detectCharset('text/html; charset=EUC-KR', new Uint8Array())).toBe('euc-kr')
    expect(detectCharset('text/html', new TextEncoder().encode('<meta charset="utf-8">'))).toBe('utf-8')
    expect(detectCharset(null, new TextEncoder().encode('<meta http-equiv="Content-Type" content="text/html; charset=windows-1252">'))).toBe('windows-1252')
    expect(detectCharset(null, new Uint8Array())).toBe('utf-8')
  })
})

describe('fetchHtml', () => {
  it('리다이렉트를 직접 따라가고 사설 목적지는 막는다', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/next' } }))
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { Location: 'http://127.0.0.1/admin' } }))
    const result = await fetchHtml('https://example.com/start', fetchImpl as unknown as typeof fetch)
    expect(result).toEqual({ ok: false, error: 'blocked' })
    expect(fetchImpl.mock.calls[1][0]).toBe('https://example.com/next')
    expect((fetchImpl.mock.calls[0][1] as RequestInit).redirect).toBe('manual')
  })
  it('리다이렉트 목적지가 IPv6 정규화로 사설 주소가 되면 막는다', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: 'http://[::ffff:127.0.0.1]/' } }))
    expect(await fetchHtml('https://example.com/start', fetchImpl as unknown as typeof fetch)).toEqual({ ok: false, error: 'blocked' })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
  it('리다이렉트가 3회를 넘으면 too-many-redirects', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'https://example.com/loop' } }))
    expect(await fetchHtml('https://example.com/', fetchImpl as unknown as typeof fetch)).toEqual({ ok: false, error: 'too-many-redirects' })
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })
  it('본문을 512KB에서 끊는다', async () => {
    const big = `<title>big</title>${'x'.repeat(700 * 1024)}`
    const result = await fetchHtml('https://example.com/', vi.fn().mockResolvedValue(html(big)) as unknown as typeof fetch)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.html.length).toBeLessThanOrEqual(512 * 1024)
  })
  it('EUC-KR 본문을 디코딩한다', async () => {
    const bytes = new Uint8Array([...new TextEncoder().encode('<title>'), 0xc7, 0xd1, 0xb1, 0xdb, ...new TextEncoder().encode('</title>')])
    const res = new Response(bytes, { status: 200, headers: { 'Content-Type': 'text/html; charset=euc-kr' } })
    const result = await fetchHtml('https://example.com/', vi.fn().mockResolvedValue(res) as unknown as typeof fetch)
    expect(result.ok && result.html).toContain('<title>한글</title>')
  })
  it('5초가 지나면 timeout', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }))
    const pending = fetchHtml('https://example.com/', fetchImpl as unknown as typeof fetch)
    await vi.advanceTimersByTimeAsync(5001)
    expect(await pending).toEqual({ ok: false, error: 'timeout' })
  })
  it('4xx/5xx는 upstream', async () => {
    const result = await fetchHtml('https://example.com/', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })) as unknown as typeof fetch)
    expect(result).toEqual({ ok: false, error: 'upstream' })
  })
})

describe('GET', () => {
  beforeEach(() => mockedOwner.mockResolvedValue({ ok: true, login: 'cozynye' }))

  it('허용되지 않은 토큰이면 403, 토큰이 없으면 401이고 대상 사이트를 부르지 않는다', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    mockedOwner.mockResolvedValueOnce({ ok: false, status: 403, error: 'not allowed' })
    expect((await GET(req('https://example.com/a'))).status).toBe(403)
    mockedOwner.mockResolvedValueOnce({ ok: false, status: 401, error: 'token required' })
    expect((await GET(req('https://example.com/a'))).status).toBe(401)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  const req = (url: string, headers: Record<string, string> = { 'sec-fetch-site': 'same-origin' }) =>
    new Request(`https://app.example/api/metadata?url=${encodeURIComponent(url)}`, { headers })

  it('정상 응답은 메타데이터와 캐시 헤더', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(html('<title>Hello</title><meta property="og:description" content="d">')))
    const res = await GET(req('https://example.com/a'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=86400')
    expect(await res.json()).toEqual({ title: 'Hello', description: 'd', image: null, siteName: 'example.com' })
  })
  it('출처가 다르면 403', async () => {
    const res = await GET(req('https://example.com/a', { 'sec-fetch-site': 'cross-site' }))
    expect(res.status).toBe(403)
  })
  it('url이 없거나 잘못되면 400', async () => {
    expect((await GET(new Request('https://app.example/api/metadata', { headers: { 'sec-fetch-site': 'same-origin' } }))).status).toBe(400)
    expect((await GET(req('not a url'))).status).toBe(400)
    expect((await GET(req('ftp://example.com/x'))).status).toBe(400)
    expect((await GET(req('http://192.168.1.1/'))).status).toBe(400)
  })
  it('대상 실패는 502, 타임아웃은 408', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x', { status: 500 })))
    expect((await GET(req('https://example.com/a'))).status).toBe(502)

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')))
    expect((await GET(req('https://example.com/a'))).status).toBe(408)
  })
  it('IPv6 정규화를 우회한 사설/예약 목적지는 400으로 막는다', async () => {
    for (const target of [
      'http://[::ffff:127.0.0.1]/',
      'http://[::ffff:169.254.169.254]/',
      'http://localhost./',
      'http://[::7f00:1]/',
      'http://[64:ff9b::a00:1]/',
      'http://[fec0::1]/',
      'http://[febf::1]/',
    ]) {
      const res = await GET(req(target))
      expect(res.status, target).toBe(400)
    }
  })
})
