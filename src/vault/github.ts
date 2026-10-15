export interface RepoRef {
  owner: string
  repo: string
  path: string
}

export class GithubError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'GithubError'
    this.status = status
  }
}

export class GithubAuthError extends GithubError {
  constructor(status: number) {
    super(status, '토큰이 유효하지 않거나 권한이 없습니다')
    this.name = 'GithubAuthError'
  }
}

export class GithubNotFoundError extends GithubError {
  constructor() {
    super(404, '파일이 없습니다')
    this.name = 'GithubNotFoundError'
  }
}

export class GithubConflictError extends GithubError {
  constructor() {
    super(409, '다른 기기에서 먼저 저장했습니다')
    this.name = 'GithubConflictError'
  }
}

export class GithubOversizeError extends GithubError {
  constructor() {
    super(200, '파일이 1MB를 넘어 읽을 수 없습니다')
    this.name = 'GithubOversizeError'
  }
}

const CHUNK = 0x8000

export function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64.replace(/\s+/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const OVERSIZE_BYTES = 1_000_000

interface ContentsGetBody {
  content?: string
  sha: string
  size?: number
}

interface ContentsPutBody {
  content: { sha: string }
}

export class GithubVaultClient {
  constructor(
    private readonly ref: RepoRef,
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = (input, init) => globalThis.fetch(input, init),
    private readonly apiBase = 'https://api.github.com',
  ) {}

  private url(): string {
    const { owner, repo, path } = this.ref
    const encodedPath = path.split('/').map(encodeURIComponent).join('/')
    return `${this.apiBase}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  }

  async readFile(): Promise<{ text: string; sha: string }> {
    const res = await this.fetchImpl(this.url(), { headers: this.headers(), cache: 'no-store' })
    if (res.status === 401 || res.status === 403) throw new GithubAuthError(res.status)
    if (res.status === 404) throw new GithubNotFoundError()
    if (!res.ok) throw new GithubError(res.status, `GitHub 응답 ${res.status}`)
    const body = (await res.json()) as ContentsGetBody
    if (!body.content && (body.size ?? 0) > OVERSIZE_BYTES) throw new GithubOversizeError()
    return { text: decodeBase64Utf8(body.content ?? ''), sha: body.sha }
  }

  async writeFile(text: string, message: string, sha: string | null): Promise<{ sha: string }> {
    const payload: Record<string, string> = { message, content: encodeBase64Utf8(text) }
    if (sha) payload.sha = sha
    const res = await this.fetchImpl(this.url(), {
      method: 'PUT',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.status === 401 || res.status === 403) throw new GithubAuthError(res.status)
    if (res.status === 409) throw new GithubConflictError()
    if (res.status === 422 && sha === null) throw new GithubConflictError()
    if (!res.ok) throw new GithubError(res.status, `GitHub 응답 ${res.status}`)
    const body = (await res.json()) as ContentsPutBody
    return { sha: body.content.sha }
  }
}
