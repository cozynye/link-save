import { verifyOwner } from './_owner'

export interface LinkMetadata {
  title: string
  description: string
  image: string | null
  siteName: string
}

const TIMEOUT_MS = 5000
const MAX_BYTES = 512 * 1024
const MAX_REDIRECTS = 3
// 허용된 사용자에게만 응답하므로 CDN 공용 캐시에 두지 않는다. 브라우저 개인 캐시만 허용한다.
const CACHE_CONTROL = 'private, max-age=86400'
const USER_AGENT = 'Mozilla/5.0 (compatible; SaveLinkBot/2.0)'

type IPv4 = [number, number, number, number]

function parseIPv4(s: string): IPv4 | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s)
  if (!m) return null
  const octets = [m[1], m[2], m[3], m[4]].map(Number)
  if (octets.some((n) => n > 255)) return null
  return octets as IPv4
}

function isPrivateIPv4([a, b, c]: IPv4): boolean {
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 192 && b === 0 && c === 0) return true // 192.0.0.0/24 (IETF protocol assignments)
  if (a === 198 && (b === 18 || b === 19)) return true // 198.18.0.0/15 (benchmarking)
  if (a === 169 && b === 254) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a >= 224) return true // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved, 255.255.255.255 broadcast
  return false
}

/** "::"로 압축된 IPv6 주소를 8개의 16비트 그룹으로 펼친다. 끝부분에 점 표기(IPv4 임베드)가 있으면 두 그룹으로 변환한다. */
function expandIPv6(h: string): number[] | null {
  let s = h
  if (s.includes('.')) {
    const lastColon = s.lastIndexOf(':')
    if (lastColon === -1) return null
    const v4 = parseIPv4(s.slice(lastColon + 1))
    if (!v4) return null
    const hi = ((v4[0] << 8) | v4[1]).toString(16)
    const lo = ((v4[2] << 8) | v4[3]).toString(16)
    s = `${s.slice(0, lastColon + 1)}${hi}:${lo}`
  }
  if (!/^[0-9a-f:]+$/.test(s)) return null
  const parts = s.split('::')
  if (parts.length > 2) return null
  if (parts.length === 1) {
    const groups = parts[0].split(':')
    if (groups.length !== 8 || groups.some((g) => g === '')) return null
    return groups.map((g) => parseInt(g, 16))
  }
  const head = parts[0] ? parts[0].split(':') : []
  const tail = parts[1] ? parts[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if (missing < 0) return null
  const groups = [...head, ...Array(missing).fill('0'), ...tail]
  if (groups.length !== 8) return null
  return groups.map((g) => parseInt(g, 16))
}

function groupsToIPv4(g: number[]): IPv4 {
  const hi = g[6]
  const lo = g[7]
  return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff]
}

function isPrivateIPv6(g: number[]): boolean {
  const prefixZero = g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0
  if (prefixZero && g[5] === 0xffff) return isPrivateIPv4(groupsToIPv4(g)) // IPv4-mapped ::ffff:a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0) {
    return isPrivateIPv4(groupsToIPv4(g)) // NAT64 64:ff9b::/96
  }
  if (prefixZero && g[5] === 0) {
    const isUnspecified = g[6] === 0 && g[7] === 0
    const isLoopback = g[6] === 0 && g[7] === 1
    if (isUnspecified || isLoopback) return true
    return isPrivateIPv4(groupsToIPv4(g)) // IPv4-compatible (deprecated) ::a.b.c.d
  }
  if (g[0] >= 0xfc00 && g[0] <= 0xfdff) return true // unique local fc00::/7
  if (g[0] >= 0xfe80 && g[0] <= 0xfeff) return true // link-local fe80::/10 + deprecated site-local fec0::/10
  return false
}

export function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0') return true
  const v4 = parseIPv4(h)
  if (v4) return isPrivateIPv4(v4)
  if (h.includes(':')) {
    const groups = expandIPv6(h)
    if (!groups) return false
    return isPrivateIPv6(groups)
  }
  return false
}

export function isAllowedOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site) return site === 'same-origin'
  const selfHost = new URL(request.url).host
  for (const name of ['origin', 'referer']) {
    const value = request.headers.get(name)
    if (!value) continue
    try {
      const host = new URL(value).host
      if (host === selfHost || host === 'localhost' || host.startsWith('localhost:')) return true
    } catch {
      // 잘못된 헤더는 무시
    }
  }
  return false
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', middot: '·', laquo: '«', raquo: '»',
}

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === '#') {
      const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match
  })
}

function readAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tag))) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  return attrs
}

export function extractMetadata(html: string, baseUrl: string): LinkMetadata {
  const meta = new Map<string, string>()
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = readAttributes(tag)
    const key = (attrs.property ?? attrs.name)?.toLowerCase()
    if (key && attrs.content !== undefined && !meta.has(key)) meta.set(key, decodeEntities(attrs.content.trim()))
  }
  const pick = (...keys: string[]) => keys.map((k) => meta.get(k)).find((v) => v && v.length > 0) ?? ''
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  const title = pick('og:title', 'twitter:title') || (titleTag ? decodeEntities(titleTag.replace(/\s+/g, ' ').trim()) : '')
  const description = pick('og:description', 'twitter:description', 'description')
  const rawImage = pick('og:image', 'og:image:url', 'twitter:image')
  let image: string | null = null
  if (rawImage) {
    try {
      const u = new URL(rawImage, baseUrl)
      if (u.protocol === 'http:' || u.protocol === 'https:') image = u.toString()
    } catch {
      image = null
    }
  }
  const host = new URL(baseUrl).hostname.replace(/^www\./, '')
  return { title, description, image, siteName: pick('og:site_name') || host }
}

export function detectCharset(contentType: string | null, bytes: Uint8Array): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1]
  if (fromHeader) return fromHeader.toLowerCase()
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096))
  const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1]
  return (fromMeta ?? 'utf-8').toLowerCase()
}

function decodeBytes(bytes: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

async function readLimited(stream: ReadableStream<Uint8Array>, max: number): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < max) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  await reader.cancel().catch(() => {})
  const out = new Uint8Array(Math.min(total, max))
  let offset = 0
  for (const chunk of chunks) {
    const room = max - offset
    if (room <= 0) break
    const slice = chunk.subarray(0, Math.min(chunk.length, room))
    out.set(slice, offset)
    offset += slice.length
  }
  return out
}

export type FetchHtmlResult =
  | { ok: true; html: string; finalUrl: string }
  | { ok: false; error: 'blocked' | 'timeout' | 'upstream' | 'too-many-redirects' }

export async function fetchHtml(startUrl: string, fetchImpl: typeof fetch = fetch): Promise<FetchHtmlResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    let current = startUrl
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const u = new URL(current)
      if ((u.protocol !== 'http:' && u.protocol !== 'https:') || isPrivateHost(u.hostname)) return { ok: false, error: 'blocked' }
      const res = await fetchImpl(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1' },
      })
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        if (!location) return { ok: false, error: 'upstream' }
        current = new URL(location, current).toString()
        continue
      }
      if (!res.ok || !res.body) return { ok: false, error: 'upstream' }
      const bytes = await readLimited(res.body, MAX_BYTES)
      return { ok: true, html: decodeBytes(bytes, detectCharset(res.headers.get('content-type'), bytes)), finalUrl: current }
    }
    return { ok: false, error: 'too-many-redirects' }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return { ok: false, error: 'timeout' }
    return { ok: false, error: 'upstream' }
  } finally {
    clearTimeout(timer)
  }
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

export async function GET(request: Request): Promise<Response> {
  if (!isAllowedOrigin(request)) return json({ error: 'forbidden' }, 403)
  const owner = await verifyOwner(request)
  if (!owner.ok) return json({ error: owner.error }, owner.status)
  const target = new URL(request.url).searchParams.get('url')
  if (!target) return json({ error: 'url required' }, 400)
  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return json({ error: 'invalid url' }, 400)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return json({ error: 'invalid url' }, 400)
  if (isPrivateHost(parsed.hostname)) return json({ error: 'blocked host' }, 400)

  const result = await fetchHtml(parsed.toString())
  if (!result.ok) {
    const status = result.error === 'timeout' ? 408 : result.error === 'blocked' ? 400 : 502
    return json({ error: result.error }, status)
  }
  return json(extractMetadata(result.html, result.finalUrl), 200, { 'Cache-Control': CACHE_CONTROL })
}
