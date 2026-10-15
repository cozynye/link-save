import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_KEY, SETTINGS_KEY, loadCache, saveCache, saveSettings } from '@/lib/settings'
import { encodeBase64Utf8 } from './github'
import { emptyVault, serializeVault, type Vault } from './schema'
import { resetVaultStoreForTests, useVaultStore } from './store'

type Route = (url: string, init: RequestInit | undefined) => Response | Promise<Response>

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
const settings = { owner: 'me', repo: 'save-link-data', path: 'links.json', token: 'tok' }

/** 메모리 GitHub. 파일이 없으면 404, PUT은 sha가 맞을 때만 성공. */
function fakeGithub(initial: Vault | null) {
  let text = initial ? serializeVault(initial) : null
  let sha = 'sha-0'
  let n = 0
  const puts: { message: string; body: Vault }[] = []
  const route: Route = async (url, init) => {
    if (!url.startsWith('https://api.github.com/repos/me/save-link-data/contents/links.json')) return json(404, {})
    if ((init?.method ?? 'GET') === 'GET') {
      return text === null ? json(404, {}) : json(200, { content: encodeBase64Utf8(text), sha, size: text.length })
    }
    const payload = JSON.parse(init!.body as string) as { message: string; content: string; sha?: string }
    if (text !== null && payload.sha !== sha) return json(409, {})
    if (text === null && payload.sha) return json(422, {})
    text = new TextDecoder().decode(Uint8Array.from(atob(payload.content), (c) => c.charCodeAt(0)))
    sha = `sha-${++n}`
    puts.push({ message: payload.message, body: JSON.parse(text) as Vault })
    return json(text ? 200 : 201, { content: { sha } })
  }
  return { route, puts, get text() { return text } }
}

function stubFetch(route: Route) {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => route(String(input), init)))
}

beforeEach(() => {
  resetVaultStoreForTests()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('init', () => {
  it('설정이 없으면 disconnected', async () => {
    await useVaultStore.getState().init()
    expect(useVaultStore.getState().status).toBe('disconnected')
  })
  it('설정과 원격 파일이 있으면 ready, 캐시를 갱신한다', async () => {
    const remote: Vault = { ...emptyVault(), tags: [{ id: 'a1b2c3', name: 'AI', color: 'violet' }] }
    stubFetch(fakeGithub(remote).route)
    saveSettings({ ...settings, theme: 'system' })
    await useVaultStore.getState().init()
    const s = useVaultStore.getState()
    expect(s.status).toBe('ready')
    expect(s.vault?.tags[0].name).toBe('AI')
    expect(loadCache()?.vault.tags[0].name).toBe('AI')
  })
  it('네트워크가 끊겼고 캐시가 있으면 offline으로 캐시를 보여준다', async () => {
    const cached: Vault = { ...emptyVault(), tags: [{ id: 'c1c1c1', name: 'Cached', color: 'red' }] }
    saveSettings({ ...settings, theme: 'system' })
    saveCache({ vault: cached, sha: 'old', fetchedAt: '2026-01-01T00:00:00.000Z' })
    stubFetch(() => { throw new TypeError('Failed to fetch') })
    await useVaultStore.getState().init()
    const s = useVaultStore.getState()
    expect(s.status).toBe('offline')
    expect(s.vault?.tags[0].name).toBe('Cached')
    expect(s.canWrite()).toEqual({ ok: false, message: '지금은 저장할 수 없어요' })
  })
  it('파일 형식이 깨졌으면 invalid-file', async () => {
    saveSettings({ ...settings, theme: 'system' })
    stubFetch(() => json(200, { content: encodeBase64Utf8('{"version":1,"tags":[],"links":[{"id":1}]}'), sha: 'x', size: 10 }))
    await useVaultStore.getState().init()
    expect(useVaultStore.getState().status).toBe('invalid-file')
    expect(useVaultStore.getState().errorDetail).toContain('links.0')
  })
  it('401이면 auth-error', async () => {
    saveSettings({ ...settings, theme: 'system' })
    stubFetch(() => json(401, {}))
    await useVaultStore.getState().init()
    expect(useVaultStore.getState().status).toBe('auth-error')
  })
})

describe('connect', () => {
  it('파일이 없으면 초기 파일을 만들고 설정을 저장한다', async () => {
    const gh = fakeGithub(null)
    stubFetch(gh.route)
    const result = await useVaultStore.getState().connect(settings)
    expect(result).toEqual({ ok: true })
    expect(gh.puts[0].message).toBe('Initialize vault')
    expect(gh.puts[0].body).toEqual(emptyVault())
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!)).toMatchObject({ owner: 'me', token: 'tok', theme: 'system' })
    expect(localStorage.getItem(CACHE_KEY)).not.toBeNull()
    expect(useVaultStore.getState().status).toBe('ready')
  })
  it('401이면 실패 메시지를 돌려주고 설정을 저장하지 않는다', async () => {
    stubFetch(() => json(401, {}))
    const result = await useVaultStore.getState().connect(settings)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('토큰')
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
    expect(useVaultStore.getState().status).toBe('disconnected')
  })
  it('레포가 없으면(404 후 PUT 404) 소유자/레포 확인 메시지', async () => {
    stubFetch(() => json(404, {}))
    const result = await useVaultStore.getState().connect(settings)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('레포')
  })
  it('공백을 정리하고 빈 path는 links.json으로 둔다', async () => {
    const gh = fakeGithub(emptyVault())
    stubFetch(gh.route)
    await useVaultStore.getState().connect({ owner: ' me ', repo: ' save-link-data ', path: '  ', token: ' tok ' })
    expect(useVaultStore.getState().settings).toMatchObject({ owner: 'me', repo: 'save-link-data', path: 'links.json', token: 'tok' })
  })
})

describe('mutations', () => {
  async function connected(initial: Vault = emptyVault()) {
    const gh = fakeGithub(initial)
    stubFetch(gh.route)
    await useVaultStore.getState().connect(settings)
    return gh
  }

  it('addLink는 즉시 화면에 반영되고 커밋된 뒤 pendingCount가 0이 된다', async () => {
    const gh = await connected()
    const link = useVaultStore.getState().addLink({ url: 'https://e.com/a', title: '첫 글', description: '', note: '', image: null, siteName: 'e.com', tags: [] })
    expect(useVaultStore.getState().vault?.links[0].id).toBe(link.id)
    expect(useVaultStore.getState().pendingCount).toBe(1)
    await useVaultStore.getState().flush()
    expect(useVaultStore.getState().pendingCount).toBe(0)
    expect(gh.puts.at(-1)?.message).toBe('Add link: 첫 글')
    expect(gh.puts.at(-1)?.body.links[0].title).toBe('첫 글')
    expect(loadCache()?.vault.links[0].title).toBe('첫 글')
  })

  it('addTag는 같은 이름이 있으면 새로 만들지 않는다', async () => {
    await connected({ ...emptyVault(), tags: [{ id: 'exist1', name: 'React', color: 'cyan' }] })
    const tag = useVaultStore.getState().addTag(' react ')
    expect(tag.id).toBe('exist1')
    expect(useVaultStore.getState().pendingCount).toBe(0)
    const fresh = useVaultStore.getState().addTag('Vue')
    expect(fresh.name).toBe('Vue')
    expect(fresh.color).toBe('red')
    expect(useVaultStore.getState().vault?.tags).toHaveLength(2)
  })

  it('deleteLink는 삭제된 링크를 돌려주고 restoreLink로 되살릴 수 있다', async () => {
    await connected()
    const link = useVaultStore.getState().addLink({ url: 'https://e.com/a', title: 'x', description: '', note: '', image: null, siteName: '', tags: [] })
    const removed = useVaultStore.getState().deleteLink(link.id)
    expect(removed?.id).toBe(link.id)
    expect(useVaultStore.getState().vault?.links).toHaveLength(0)
    useVaultStore.getState().restoreLink(removed!)
    expect(useVaultStore.getState().vault?.links[0].id).toBe(link.id)
    await useVaultStore.getState().flush()
  })

  it('togglePin은 pinned만 바꾸는 updateLink다', async () => {
    const gh = await connected()
    const link = useVaultStore.getState().addLink({ url: 'https://e.com/a', title: 'x', description: '', note: '', image: null, siteName: '', tags: [] })
    useVaultStore.getState().togglePin(link.id)
    await useVaultStore.getState().flush()
    expect(gh.puts.at(-1)?.message).toBe('Pin link: x')
    expect(gh.puts.at(-1)?.body.links[0].pinned).toBe(true)
  })

  it('쓰기 실패는 lastFailure에 기록된다', async () => {
    await connected()
    vi.stubGlobal('fetch', vi.fn(async () => json(500, {})))
    useVaultStore.getState().addLink({ url: 'https://e.com/a', title: 'x', description: '', note: '', image: null, siteName: '', tags: [] })
    await useVaultStore.getState().flush()
    expect(useVaultStore.getState().lastFailure?.message).toContain('링크 저장')
    expect(useVaultStore.getState().vault?.links).toHaveLength(0)
  })

  it('쓰기 중 401이면 auth-error가 되고 재연결 후 이어서 커밋한다', async () => {
    const gh = await connected()
    let deny = true
    const original = gh.route
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (deny && (init?.method ?? 'GET') === 'PUT') return json(401, {})
      return original(String(input), init)
    }))
    useVaultStore.getState().addLink({ url: 'https://e.com/a', title: '보류', description: '', note: '', image: null, siteName: '', tags: [] })
    await useVaultStore.getState().flush()
    expect(useVaultStore.getState().status).toBe('auth-error')
    expect(useVaultStore.getState().pendingCount).toBe(1)
    expect(useVaultStore.getState().vault?.links[0].title).toBe('보류')
    expect(useVaultStore.getState().canWrite().ok).toBe(false)

    deny = false
    const result = await useVaultStore.getState().connect({ ...settings, token: 'new-tok' })
    expect(result).toEqual({ ok: true })
    await useVaultStore.getState().flush()
    expect(useVaultStore.getState().status).toBe('ready')
    expect(useVaultStore.getState().pendingCount).toBe(0)
    expect(gh.puts.at(-1)?.body.links[0].title).toBe('보류')
  })

  it('canWrite는 오프라인이면 거절한다', async () => {
    await connected()
    useVaultStore.getState().setOnline(false)
    expect(useVaultStore.getState().canWrite()).toEqual({ ok: false, message: '오프라인이라 저장할 수 없어요' })
  })

  it('disconnect는 저장소와 상태를 비운다', async () => {
    await connected()
    useVaultStore.getState().disconnect()
    expect(useVaultStore.getState().status).toBe('disconnected')
    expect(useVaultStore.getState().vault).toBeNull()
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
  })

  it('setTheme은 설정에 저장하고 html에 적용한다', async () => {
    await connected()
    useVaultStore.getState().setTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!).theme).toBe('dark')
  })
})

describe('fix round 1', () => {
  async function connected(initial: Vault = emptyVault()) {
    const gh = fakeGithub(initial)
    stubFetch(gh.route)
    await useVaultStore.getState().connect(settings)
    return gh
  }

  // I-1: 쓰기가 403으로 멈춘 뒤 reload()해도 auth-error를 유지해야 한다 (같은 토큰으로 GET은 되고 PUT만 막힌 경우).
  it('쓰기 중 403으로 멈춘 뒤 reload해도 auth-error를 유지한다', async () => {
    const gh = await connected()
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'PUT') return json(403, {})
      return gh.route(String(input), init)
    }))
    useVaultStore.getState().addLink({ url: 'https://e.com/a', title: '막힘', description: '', note: '', image: null, siteName: '', tags: [] })
    await useVaultStore.getState().flush()
    expect(useVaultStore.getState().status).toBe('auth-error')
    expect(useVaultStore.getState().pendingCount).toBe(1)

    await useVaultStore.getState().reload()
    expect(useVaultStore.getState().status).toBe('auth-error')
    expect(useVaultStore.getState().pendingCount).toBe(1)
    expect(useVaultStore.getState().canWrite().ok).toBe(false)
  })

  // I-2: disconnect() 시점에 진행 중이던 쓰기가 나중에 끝나도(심지어 실패로 끝나도),
  // 이미 연결이 끊어진 스토어 상태를 덮어쓰면 안 된다. 쓰기가 실패하는 경우로 만들어
  // onFailure 핸들러가 가드 없이 그대로 set()을 호출하는 경로를 드러낸다.
  it('disconnect 중 진행 중이던 쓰기가 끝나도(실패여도) 상태를 덮어쓰지 않는다', async () => {
    await connected()
    const deferred: { resolve: ((res: Response) => void) | null } = { resolve: null }
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'PUT') {
        return new Promise<Response>((resolve) => { deferred.resolve = resolve })
      }
      return json(404, {})
    }))
    useVaultStore.getState().addLink({ url: 'https://e.com/a', title: '진행중', description: '', note: '', image: null, siteName: '', tags: [] })
    expect(useVaultStore.getState().pendingCount).toBe(1)

    useVaultStore.getState().disconnect()
    expect(useVaultStore.getState().status).toBe('disconnected')

    deferred.resolve?.(json(500, {}))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(useVaultStore.getState().status).toBe('disconnected')
    expect(useVaultStore.getState().lastFailure).toBeNull()
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
  })

  // M-1 (finding 3, 선택): 보류 중인 변경이 있는데 원격 파일을 다시 읽지 못하면, 몇 건이 사라졌는지 lastFailure에 남긴다.
  it('보류 중 변경이 있을 때 파일을 다시 읽지 못하면 버려졌다고 기록한다', async () => {
    await connected()
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'PUT') return new Promise<Response>(() => {})
      return json(200, { content: encodeBase64Utf8('{"version":1,"tags":[],"links":[{"id":1}]}'), sha: 'x', size: 10 })
    }))
    useVaultStore.getState().addLink({ url: 'https://e.com/a', title: '보류3', description: '', note: '', image: null, siteName: '', tags: [] })
    expect(useVaultStore.getState().pendingCount).toBe(1)

    await useVaultStore.getState().reload()
    expect(useVaultStore.getState().status).toBe('invalid-file')
    expect(useVaultStore.getState().lastFailure?.message).toContain('1')
  })

  // M-2 (finding 4): 보류 중인 변경이 있는 채로 다른 저장소에 연결하면 버려지고 lastFailure가 남아야 한다.
  it('다른 저장소로 연결하면 보류 중이던 변경을 버리고 lastFailure를 남긴다', async () => {
    const gh = await connected()
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'PUT') return new Promise<Response>(() => {})
      return gh.route(String(input), init)
    }))
    useVaultStore.getState().addLink({ url: 'https://e.com/a', title: '버려짐', description: '', note: '', image: null, siteName: '', tags: [] })
    expect(useVaultStore.getState().pendingCount).toBe(1)

    const putMessages: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (!url.includes('other-repo')) return json(404, {})
      if ((init?.method ?? 'GET') === 'GET') return json(404, {})
      const payload = JSON.parse(init!.body as string) as { message: string }
      putMessages.push(payload.message)
      return json(201, { content: { sha: 'sha-new' } })
    }))

    const result = await useVaultStore.getState().connect({ owner: 'me', repo: 'other-repo', path: 'links.json', token: 'tok2' })
    expect(result).toEqual({ ok: true })
    expect(putMessages).toEqual(['Initialize vault'])
    expect(useVaultStore.getState().lastFailure?.message).toContain('1')
  })
})

describe('fix round 2: stale loadRemote race', () => {
  it('init 중 disconnect하면 늦게 끝난 GET이 상태나 캐시를 덮어쓰지 않는다', async () => {
    saveSettings({ ...settings, theme: 'system' })
    const deferred: { resolve: ((res: Response) => void) | null } = { resolve: null }
    stubFetch((_url, init) => {
      if ((init?.method ?? 'GET') === 'GET') return new Promise<Response>((resolve) => { deferred.resolve = resolve })
      return json(404, {})
    })

    const initPromise = useVaultStore.getState().init()
    useVaultStore.getState().disconnect()
    expect(useVaultStore.getState().status).toBe('disconnected')

    deferred.resolve?.(json(200, { content: encodeBase64Utf8(serializeVault(emptyVault())), sha: 'sha-x', size: 10 }))
    await initPromise

    const s = useVaultStore.getState()
    expect(s.status).toBe('disconnected')
    expect(s.settings).toBeNull()
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
  })

  it('A 연결 중 connect(B)가 끝난 뒤 A의 GET이 늦게 끝나도 B 상태를 유지하고, 이후 쓰기는 B로 간다', async () => {
    saveSettings({ owner: 'me', repo: 'repo-a', path: 'links.json', token: 'tok-a', theme: 'system' })
    const deferredA: { resolve: ((res: Response) => void) | null } = { resolve: null }
    stubFetch((url, init) => {
      if (url.includes('repo-a') && (init?.method ?? 'GET') === 'GET') {
        return new Promise<Response>((resolve) => { deferredA.resolve = resolve })
      }
      return json(404, {})
    })
    const initPromise = useVaultStore.getState().init()

    const ghB = fakeGithub(emptyVault())
    stubFetch(ghB.route)
    const result = await useVaultStore.getState().connect(settings)
    expect(result).toEqual({ ok: true })
    expect(useVaultStore.getState().settings?.repo).toBe('save-link-data')

    deferredA.resolve?.(json(200, { content: encodeBase64Utf8(serializeVault(emptyVault())), sha: 'sha-a', size: 10 }))
    await initPromise

    const s = useVaultStore.getState()
    expect(s.settings?.repo).toBe('save-link-data')
    expect(s.sha).not.toBe('sha-a')

    useVaultStore.getState().addLink({ url: 'https://e.com/a', title: 'B로', description: '', note: '', image: null, siteName: '', tags: [] })
    await useVaultStore.getState().flush()
    expect(ghB.puts.at(-1)?.body.links[0].title).toBe('B로')
  })
})

describe('regression fix: connect() 실패는 generation을 올리지 않는다', () => {
  // init(A)이 GET 중일 때 connect()가 401로 실패해도, generation이 바뀌면 안 된다.
  // 안 그러면 나중에 끝난 A의 GET이 무시되어 상태가 'loading'에 영원히 멈춘다.
  it('연결 중 GET이 진행 중일 때 connect가 401로 실패해도 나중에 GET이 끝나면 ready가 된다', async () => {
    saveSettings({ ...settings, theme: 'system' })
    const deferred: { resolve: ((res: Response) => void) | null } = { resolve: null }
    stubFetch((_url, init) => {
      if ((init?.method ?? 'GET') === 'GET') return new Promise<Response>((resolve) => { deferred.resolve = resolve })
      return json(404, {})
    })
    const initPromise = useVaultStore.getState().init()

    stubFetch(() => json(401, {}))
    const result = await useVaultStore.getState().connect({ ...settings, token: 'bad-tok' })
    expect(result.ok).toBe(false)

    deferred.resolve?.(json(200, { content: encodeBase64Utf8(serializeVault(emptyVault())), sha: 'sha-a', size: 10 }))
    await initPromise

    const s = useVaultStore.getState()
    expect(s.status).toBe('ready')
    expect(s.sha).toBe('sha-a')
  })

  // connect(B)가 아직 자신의 GET을 기다리는 중에 reload()(여전히 A 설정)가 시작되면,
  // reload는 그 시점의(아직 B가 성공하기 전) generation을 기억한다. 그 뒤 connect(B)가
  // 성공해 generation이 올라가면, 늦게 끝난 reload(A)의 GET은 무시되어야 한다.
  it('connect(B) 진행 중 시작된 reload(A)가 늦게 끝나도 B 상태를 유지하고, 이후 쓰기는 B로 간다', async () => {
    const settingsA = { owner: 'me', repo: 'repo-a', path: 'links.json', token: 'tok-a' }
    const textA = serializeVault(emptyVault())
    stubFetch((url, init) => {
      if (!url.includes('repo-a')) return json(404, {})
      if ((init?.method ?? 'GET') === 'GET') return json(200, { content: encodeBase64Utf8(textA), sha: 'sha-a-0', size: textA.length })
      return json(404, {})
    })
    const connectA = await useVaultStore.getState().connect(settingsA)
    expect(connectA).toEqual({ ok: true })
    expect(useVaultStore.getState().status).toBe('ready')

    const deferredB: { resolve: ((res: Response) => void) | null } = { resolve: null }
    const deferredAReload: { resolve: ((res: Response) => void) | null } = { resolve: null }
    const putsB: { message: string }[] = []
    stubFetch((url, init) => {
      const method = init?.method ?? 'GET'
      if (url.includes('repo-a') && method === 'GET') {
        return new Promise<Response>((resolve) => { deferredAReload.resolve = resolve })
      }
      if (url.includes('save-link-data')) {
        if (method === 'GET') return new Promise<Response>((resolve) => { deferredB.resolve = resolve })
        const payload = JSON.parse(init!.body as string) as { message: string; body?: unknown }
        putsB.push({ message: payload.message })
        return json(201, { content: { sha: 'sha-b-init' } })
      }
      return json(404, {})
    })

    const connectBPromise = useVaultStore.getState().connect(settings) // settings.repo === 'save-link-data'
    const reloadPromise = useVaultStore.getState().reload() // 아직 A 설정을 쓴다; A의 GET은 deferredAReload로 멈춰 있다

    // B의 GET을 404로 끝내 '파일 없음 → 초기화' 경로를 타게 하고 connect(B)를 완료시킨다.
    deferredB.resolve?.(json(404, {}))
    await connectBPromise
    expect(useVaultStore.getState().settings?.repo).toBe('save-link-data')
    const shaAfterConnectB = useVaultStore.getState().sha

    // 이제야 A의 reload GET을 늦게 끝낸다.
    deferredAReload.resolve?.(json(200, { content: encodeBase64Utf8(serializeVault(emptyVault())), sha: 'sha-a-reload', size: 10 }))
    await reloadPromise

    const s = useVaultStore.getState()
    expect(s.settings?.repo).toBe('save-link-data')
    expect(s.sha).toBe(shaAfterConnectB)
    expect(s.sha).not.toBe('sha-a-reload')
    expect(putsB.some((p) => p.message === 'Initialize vault')).toBe(true)

    useVaultStore.getState().addLink({ url: 'https://e.com/a', title: 'B로-reload', description: '', note: '', image: null, siteName: '', tags: [] })
    await useVaultStore.getState().flush()
    expect(putsB.at(-1)?.message).toBe('Add link: B로-reload')
  })
})
