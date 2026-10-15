import type { Plugin } from 'vite'

type Handler = (request: Request) => Promise<Response>

/** 개발 중 `/api/metadata`를 Vercel 함수 모듈로 처리한다. 배포에서는 Vercel이 `api/`를 직접 서빙한다. */
export function vercelApiDev(): Plugin {
  return {
    name: 'savelink-vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !/^\/api\/metadata(?:\?.*)?$/.test(req.url)) return next()
        try {
          const mod = (await server.ssrLoadModule('/api/metadata.ts')) as { GET: Handler }
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value)
          }
          const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, { method: req.method ?? 'GET', headers })
          const response = await mod.GET(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(error) }))
        }
      })
    },
  }
}
