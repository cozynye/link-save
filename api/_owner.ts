// 밑줄로 시작하는 파일은 Vercel이 라우트로 배포하지 않는다. 공용 헬퍼다.

/** 이 앱을 쓸 수 있는 GitHub 계정. 대소문자는 무시한다. 사람을 추가하려면 여기에 적는다. */
export const ALLOWED_GITHUB_LOGINS: readonly string[] = ['cozynye']

const CACHE_TTL_MS = 10 * 60 * 1000

interface CacheEntry {
  login: string
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()

export type OwnerResult = { ok: true; login: string } | { ok: false; status: 401 | 403 | 502; error: string }

export function isAllowedLogin(login: string): boolean {
  const lower = login.toLowerCase()
  return ALLOWED_GITHUB_LOGINS.some((allowed) => allowed.toLowerCase() === lower)
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  const match = header ? /^Bearer\s+(\S+)$/i.exec(header.trim()) : null
  return match ? match[1] : null
}

async function cacheKey(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 요청의 GitHub 토큰 주인을 확인한다. 토큰은 저장하지 않고, 해시만 10분간 메모리에 캐시한다. */
export async function verifyOwner(request: Request, fetchImpl: typeof fetch = fetch, now: number = Date.now()): Promise<OwnerResult> {
  const token = bearerToken(request)
  if (!token) return { ok: false, status: 401, error: 'token required' }

  const key = await cacheKey(token)
  const cached = cache.get(key)
  let login: string
  if (cached && cached.expiresAt > now) {
    login = cached.login
  } else {
    let res: Response
    try {
      res = await fetchImpl('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'SaveLink',
        },
      })
    } catch {
      return { ok: false, status: 502, error: 'github unreachable' }
    }
    if (res.status === 401) return { ok: false, status: 401, error: 'invalid token' }
    if (!res.ok) return { ok: false, status: 502, error: `github ${res.status}` }
    const body = (await res.json()) as { login?: unknown }
    if (typeof body.login !== 'string') return { ok: false, status: 502, error: 'unexpected github response' }
    login = body.login
    cache.set(key, { login, expiresAt: now + CACHE_TTL_MS })
  }

  if (!isAllowedLogin(login)) return { ok: false, status: 403, error: 'not allowed' }
  return { ok: true, login }
}

export function clearOwnerCacheForTests(): void {
  cache.clear()
}
