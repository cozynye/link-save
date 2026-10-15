// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { vercelApiDev } from './vite.api-dev'

interface FakeReq { url?: string; headers: Record<string, string>; method?: string }
interface FakeRes { statusCode: number; setHeader: (key: string, value: string) => void; end: (chunk?: Buffer) => void }
type Middleware = (req: FakeReq, res: FakeRes, next: () => void) => Promise<void>

function setup() {
  const ssrLoadModule = vi.fn()
  let middleware: Middleware | undefined
  const server = {
    ssrLoadModule,
    middlewares: { use: (fn: Middleware) => { middleware = fn } },
  }
  const configureServer = vercelApiDev().configureServer as unknown as (server: typeof server) => void
  configureServer(server)
  if (!middleware) throw new Error('middleware not registered')
  return { middleware, ssrLoadModule }
}

function makeRes(): FakeRes {
  return { statusCode: 0, setHeader: vi.fn(), end: vi.fn() }
}

describe('vercelApiDev', () => {
  it('접두사만 같은 경로(/api/metadata-foo)는 다음 미들웨어로 넘긴다', async () => {
    const { middleware, ssrLoadModule } = setup()
    const next = vi.fn()
    await middleware({ url: '/api/metadata-foo', headers: {} }, makeRes(), next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(ssrLoadModule).not.toHaveBeenCalled()
  })

  it('정확한 경로와 쿼리스트링이 붙은 경로는 처리한다', async () => {
    const { middleware, ssrLoadModule } = setup()
    ssrLoadModule.mockResolvedValue({ GET: vi.fn().mockResolvedValue(new Response('{}', { status: 200 })) })
    const next = vi.fn()
    const res = makeRes()
    await middleware({ url: '/api/metadata?url=https://example.com', headers: { host: 'localhost:5173' } }, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(ssrLoadModule).toHaveBeenCalledWith('/api/metadata.ts')
    expect(res.statusCode).toBe(200)
  })

  it('/api/allowed도 같은 방식으로 처리한다', async () => {
    const { middleware, ssrLoadModule } = setup()
    ssrLoadModule.mockResolvedValue({ GET: vi.fn().mockResolvedValue(new Response('{}', { status: 403 })) })
    const res = makeRes()
    await middleware({ url: '/api/allowed', headers: { host: 'localhost:5173' } }, res, vi.fn())
    expect(ssrLoadModule).toHaveBeenCalledWith('/api/allowed.ts')
    expect(res.statusCode).toBe(403)
  })
})
