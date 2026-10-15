import type { Page } from '@playwright/test'

export interface MockTag { id: string; name: string; color: string }
export interface MockLink {
  id: string; url: string; title: string; description: string; note: string; image: string | null; siteName: string
  tags: string[]; pinned: boolean; createdAt: string; updatedAt: string
}
export interface MockVault { version: 1; tags: MockTag[]; links: MockLink[] }

export const emptyVault = (): MockVault => ({ version: 1, tags: [], links: [] })

export function link(id: string, over: Partial<MockLink> = {}): MockLink {
  return {
    id, url: `https://example.com/${id}`, title: `제목 ${id}`, description: '', note: '', image: null, siteName: 'example.com',
    tags: [], pinned: false, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', ...over,
  }
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, accept, x-github-api-version',
  'access-control-allow-methods': 'GET, PUT, OPTIONS',
}

export async function installGithubMock(page: Page, opts: { initial: MockVault | null; metadata?: Record<string, unknown> }) {
  let text: string | null = opts.initial ? `${JSON.stringify(opts.initial, null, 2)}\n` : null
  let sha = 'sha-0'
  let counter = 0
  const puts: { message: string; vault: MockVault }[] = []

  await page.route('https://api.github.com/repos/**/contents/**', async (route) => {
    const request = route.request()
    const method = request.method()
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    if (method === 'GET') {
      if (text === null) return route.fulfill({ status: 404, headers: CORS, json: { message: 'Not Found' } })
      return route.fulfill({ status: 200, headers: CORS, json: { content: Buffer.from(text, 'utf-8').toString('base64'), sha, size: text.length } })
    }
    if (method === 'PUT') {
      const body = request.postDataJSON() as { message: string; content: string; sha?: string }
      if (text !== null && body.sha !== sha) return route.fulfill({ status: 409, headers: CORS, json: {} })
      text = Buffer.from(body.content, 'base64').toString('utf-8')
      sha = `sha-${++counter}`
      puts.push({ message: body.message, vault: JSON.parse(text) as MockVault })
      return route.fulfill({ status: 200, headers: CORS, json: { content: { sha } } })
    }
    return route.fulfill({ status: 405, headers: CORS })
  })

  await page.route('**/api/metadata**', (route) =>
    route.fulfill({ status: 200, json: { title: 'OG 제목', description: 'OG 설명', image: null, siteName: 'example.com', ...opts.metadata } }),
  )

  return {
    puts,
    get vault(): MockVault | null {
      return text ? (JSON.parse(text) as MockVault) : null
    },
  }
}

export async function seedSettings(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('savelink.settings', JSON.stringify({ owner: 'me', repo: 'save-link-data', path: 'links.json', token: 'e2e-token', theme: 'light' }))
  })
}
