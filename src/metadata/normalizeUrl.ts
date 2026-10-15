export type NormalizeResult = { ok: true; url: string } | { ok: false; reason: 'empty' | 'invalid' | 'protocol' }

const TRACKING_EXACT = new Set(['fbclid', 'gclid', 'igshid', 'mc_cid', 'mc_eid'])
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i

export function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.startsWith('utm_') || TRACKING_EXACT.has(lower)
}

export function normalizeUrl(input: string): NormalizeResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, reason: 'empty' }
  const withScheme = SCHEME_RE.test(trimmed) ? trimmed : `https://${trimmed}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return { ok: false, reason: 'invalid' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, reason: 'protocol' }
  if (!url.hostname || (!url.hostname.includes('.') && url.hostname !== 'localhost')) return { ok: false, reason: 'invalid' }

  url.hash = ''
  const kept = new URLSearchParams()
  for (const [key, value] of url.searchParams) {
    if (!isTrackingParam(key)) kept.append(key, value)
  }
  const query = kept.toString()
  url.search = query ? `?${query}` : ''
  if (url.pathname !== '/' && url.pathname.endsWith('/')) url.pathname = url.pathname.replace(/\/+$/, '')

  return { ok: true, url: url.toString() }
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function looksLikeUrl(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || /\s/.test(trimmed)) return false
  return normalizeUrl(trimmed).ok
}
