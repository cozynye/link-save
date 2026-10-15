import { verifyOwner } from './_owner.js'

/** 연결 단계에서 토큰 주인이 허용된 계정인지 알려 준다. 200 / 401 / 403. */
export async function GET(request: Request): Promise<Response> {
  const result = await verifyOwner(request)
  const body = result.ok ? { login: result.login } : { error: result.error }
  return new Response(JSON.stringify(body), {
    status: result.ok ? 200 : result.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
