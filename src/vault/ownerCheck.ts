/** 서버(`/api/allowed`)에 토큰 주인이 허용된 계정인지 묻는다. 200이 아니면 모두 거절이다. */
export type OwnerCheckResult = 'allowed' | 'denied' | 'unreachable'

export async function checkOwner(
  token: string,
  fetchImpl: typeof fetch = (input, init) => globalThis.fetch(input, init),
): Promise<OwnerCheckResult> {
  try {
    const res = await fetchImpl('/api/allowed', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    return res.ok ? 'allowed' : 'denied'
  } catch {
    return 'unreachable'
  }
}
