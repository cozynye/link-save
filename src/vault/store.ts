import { create } from 'zustand'
import { clearCache, clearSettings, loadCache, loadSettings, saveCache, saveSettings, DEFAULT_PATH, type Settings } from '@/lib/settings'
import { applyTheme, type ThemePref } from '@/lib/theme'
import { GithubAuthError, GithubError, GithubNotFoundError, GithubOversizeError, GithubVaultClient } from './github'
import { findTagByName, pickTagColor, type LinkPatch, type Op, type TagPatch } from './ops'
import { WriteQueue, type Confirmed, type QueueSnapshot } from './queue'
import { emptyVault, newLinkId, newTagId, parseVault, serializeVault, type Link, type Tag, type TagColor, type Vault } from './schema'

export type VaultStatus =
  | 'disconnected'
  | 'loading'
  | 'ready'
  | 'offline'
  | 'auth-error'
  | 'invalid-file'
  | 'unsupported-version'
  | 'oversize'
  | 'error'

export interface NewLinkInput {
  url: string
  title: string
  description: string
  note: string
  image: string | null
  siteName: string
  tags: string[]
}

export interface Failure {
  message: string
  at: number
}

export type ConnectInput = { owner: string; repo: string; path: string; token: string }
export type ConnectResult = { ok: true } | { ok: false; message: string }
export type WriteGuard = ConnectResult

export interface VaultState {
  status: VaultStatus
  settings: Settings | null
  vault: Vault | null
  sha: string | null
  pendingCount: number
  writing: boolean
  online: boolean
  lastSyncedAt: string | null
  errorDetail: string | null
  lastFailure: Failure | null

  init(): Promise<void>
  connect(input: ConnectInput): Promise<ConnectResult>
  reload(): Promise<void>
  disconnect(): void
  flush(): Promise<void>
  setOnline(online: boolean): void
  setTheme(theme: ThemePref): void

  canWrite(): WriteGuard
  addLink(input: NewLinkInput): Link
  updateLink(id: string, patch: LinkPatch): void
  deleteLink(id: string): Link | undefined
  restoreLink(link: Link): void
  togglePin(id: string): void
  addTag(name: string, color?: TagColor): Tag
  updateTag(id: string, patch: TagPatch): void
  deleteTag(id: string): void
}

let queue: WriteQueue | null = null
/** 현재 `queue`의 IO가 사용해야 하는 클라이언트. 큐별로 묶여 있어, 연결이 끊기거나
 * 다른 저장소로 바뀐 뒤에도 예전 큐가 새 클라이언트로 잘못 쓰는 것을 막는다. */
let queueClient: GithubVaultClient | null = null
/** connect()/disconnect()마다 증가하는 세대 값. loadRemote는 자신의 await 전에
 * 이 값을 기억해 뒀다가, 끝난 뒤 값이 바뀌었으면(그 사이 disconnect되거나 다른
 * 저장소로 connect됨) 상태·큐·캐시를 전혀 건드리지 않고 그냥 끝낸다. */
let generation = 0

const initialState = {
  status: 'disconnected' as VaultStatus,
  settings: null,
  vault: null,
  sha: null,
  pendingCount: 0,
  writing: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastSyncedAt: null,
  errorDetail: null,
  lastFailure: null,
}

const OP_LABEL: Record<Op['type'], string> = {
  addLink: '링크 저장',
  updateLink: '링크 수정',
  deleteLink: '링크 삭제',
  addTag: '태그 추가',
  updateTag: '태그 수정',
  deleteTag: '태그 삭제',
}

function describeFailure(op: Op, error: unknown): string {
  const reason = error instanceof Error ? error.message : String(error)
  return `${OP_LABEL[op.type]}에 실패했어요: ${reason}`
}

function parseOrThrow(text: string): Vault {
  const parsed = parseVault(text)
  if (!parsed.ok) throw new Error(parsed.detail ?? parsed.reason)
  return parsed.vault
}

type OpenResult = { ok: true; value: Confirmed } | { ok: false; status: VaultStatus; message: string; detail?: string }

/** 파일을 읽고, 없으면 빈 파일을 만든다. 인증·네트워크 오류는 throw. */
async function openVault(c: GithubVaultClient): Promise<OpenResult> {
  let text: string
  let sha: string
  try {
    ;({ text, sha } = await c.readFile())
  } catch (error) {
    if (!(error instanceof GithubNotFoundError)) throw error
    const initial = emptyVault()
    const created = await c.writeFile(serializeVault(initial), 'Initialize vault', null)
    return { ok: true, value: { vault: initial, sha: created.sha } }
  }
  const parsed = parseVault(text)
  if (!parsed.ok) {
    if (parsed.reason === 'unsupported-version') {
      return { ok: false, status: 'unsupported-version', message: `지원하지 않는 파일 버전입니다 (${parsed.detail})`, detail: parsed.detail }
    }
    return { ok: false, status: 'invalid-file', message: '파일 형식이 올바르지 않습니다. GitHub에서 확인해 주세요', detail: parsed.detail }
  }
  return { ok: true, value: { vault: parsed.vault, sha } }
}

export const useVaultStore = create<VaultState>()((set, get) => {
  const syncFromQueue = (snapshot: QueueSnapshot) => {
    const q = queue
    if (!q) return
    const idle = snapshot.pending.length === 0 && snapshot.status === 'idle'
    const patch: Partial<VaultState> = {
      vault: q.view,
      sha: snapshot.confirmed.sha,
      pendingCount: snapshot.pending.length,
      writing: snapshot.status === 'writing',
    }
    if (idle) {
      const fetchedAt = new Date().toISOString()
      saveCache({ vault: snapshot.confirmed.vault, sha: snapshot.confirmed.sha, fetchedAt })
      patch.lastSyncedAt = fetchedAt
    }
    set(patch)
  }

  /** 이 큐가 여전히 현재 큐일 때만 그 큐에 묶인 클라이언트를 돌려준다. 연결 해제나
   * 다른 저장소로의 재연결 뒤 남아있는(orphaned) 큐가 엉뚱한 저장소에 쓰는 것을 막는다. */
  const clientFor = (expected: WriteQueue): GithubVaultClient => {
    if (queue !== expected || !queueClient) throw new Error('연결이 끊어졌습니다')
    return queueClient
  }

  const attachQueue = (confirmed: Confirmed, c: GithubVaultClient) => {
    const myQueue: WriteQueue = new WriteQueue(
      confirmed,
      {
        read: () => clientFor(myQueue).readFile(),
        write: (text, message, sha) => clientFor(myQueue).writeFile(text, message, sha),
        parse: parseOrThrow,
      },
      {
        // 이 큐가 더 이상 현재 큐가 아니면(연결 해제·다른 저장소로 재연결) 이벤트를 무시해
        // orphaned 큐가 현재 상태를 덮어쓰지 못하게 한다.
        onChange: (snapshot) => {
          if (queue === myQueue) syncFromQueue(snapshot)
        },
        onFailure: (op, error) => {
          if (queue === myQueue) set({ lastFailure: { message: describeFailure(op, error), at: Date.now() } })
        },
        onAuthError: (error) => {
          if (queue === myQueue) set({ status: 'auth-error', errorDetail: error instanceof Error ? error.message : null })
        },
      },
    )
    queue = myQueue
    queueClient = c
  }

  const mustQueue = (): WriteQueue => {
    if (!queue) throw new Error('연결되지 않았습니다')
    return queue
  }

  const becomeReady = (confirmed: Confirmed) => {
    const fetchedAt = new Date().toISOString()
    saveCache({ vault: confirmed.vault, sha: confirmed.sha, fetchedAt })
    set({
      status: 'ready',
      vault: queue ? queue.view : confirmed.vault,
      sha: confirmed.sha,
      pendingCount: queue ? queue.snapshot.pending.length : 0,
      writing: false,
      lastSyncedAt: fetchedAt,
      errorDetail: null,
    })
  }

  const loadRemote = async (settings: Settings, hasCache: boolean): Promise<void> => {
    const myGeneration = generation
    const c = new GithubVaultClient({ owner: settings.owner, repo: settings.repo, path: settings.path }, settings.token)
    try {
      const opened = await openVault(c)
      if (generation !== myGeneration) return
      if (!opened.ok) {
        // 파일을 다시 읽지 못했다. 큐를 버려야 하므로, 보류 중이던 변경이 있었다면
        // 사라졌다고 알린다 (M-1).
        const discarded = queue?.snapshot.pending.length ?? 0
        queue = null
        queueClient = null
        const patch: Partial<VaultState> = { status: opened.status, errorDetail: opened.detail ?? opened.message }
        if (discarded > 0) {
          patch.lastFailure = { message: `파일을 다시 읽을 수 없어 저장하지 못한 변경 ${discarded}건이 사라졌어요`, at: Date.now() }
        }
        set(patch)
        return
      }
      if (queue) {
        queue.replaceConfirmed(opened.value)
        queueClient = c
      } else {
        attachQueue(opened.value, c)
      }
      // 쓰기가 인증 오류로 멈춰 있던 큐라면(같은 토큰으로 읽기는 되고 쓰기만 막힌 경우),
      // 다시 읽기가 됐다고 해서 ready로 돌아가면 안 된다 — 멈춰 있는 동안 새로 들어온
      // 변경이 영원히 drain되지 않는다 (I-1).
      const activeQueue = mustQueue()
      if (activeQueue.snapshot.status === 'paused-auth') {
        set({
          status: 'auth-error',
          vault: activeQueue.view,
          sha: opened.value.sha,
          pendingCount: activeQueue.snapshot.pending.length,
          writing: false,
        })
        return
      }
      becomeReady(opened.value)
    } catch (error) {
      if (generation !== myGeneration) return
      if (error instanceof GithubAuthError) return set({ status: 'auth-error', errorDetail: error.message })
      if (error instanceof GithubOversizeError) return set({ status: 'oversize', errorDetail: error.message })
      if (error instanceof GithubError) return set({ status: 'error', errorDetail: `GitHub 응답 ${error.status}` })
      if (error instanceof TypeError) {
        return set({ status: hasCache ? 'offline' : 'error', errorDetail: hasCache ? null : '네트워크에 연결할 수 없습니다' })
      }
      set({ status: 'error', errorDetail: error instanceof Error ? error.message : String(error) })
    }
  }

  const enqueue = (op: Op) => mustQueue().enqueue(op)

  return {
    ...initialState,

    async init() {
      const settings = loadSettings()
      if (!settings) {
        set({ status: 'disconnected', settings: null })
        return
      }
      applyTheme(settings.theme)
      const cache = loadCache()
      set({ settings, status: 'loading', vault: cache?.vault ?? null, sha: cache?.sha ?? null, lastSyncedAt: cache?.fetchedAt ?? null })
      await loadRemote(settings, cache !== null)
    },

    async connect(input) {
      const prevSettings = get().settings
      const theme = prevSettings?.theme ?? 'system'
      const settings: Settings = {
        owner: input.owner.trim(),
        repo: input.repo.trim(),
        path: input.path.trim() || DEFAULT_PATH,
        token: input.token.trim(),
        theme,
      }
      const c = new GithubVaultClient({ owner: settings.owner, repo: settings.repo, path: settings.path }, settings.token)
      try {
        const opened = await openVault(c)
        if (!opened.ok) return { ok: false, message: opened.message }
        // 이 지점부터는 연결이 확정된다. 실패(위 return이나 아래 catch)는 다른
        // 진행 중인 loadRemote를 무효화해서는 안 되므로, 성공이 확정된 뒤에만
        // generation을 올려 상태를 커밋하기 전에 다른 loadRemote를 무효화한다.
        generation++
        saveSettings(settings)
        // 보류 중인 변경을 이어서 커밋할지는 같은 저장소(owner/repo/path)로
        // 재연결하는 경우에만 허용한다. 다른 저장소라면 그 변경들은 엉뚱한
        // 저장소로 나가버리므로 버리고 알린다 (M-2).
        const sameRepo =
          !!prevSettings && prevSettings.owner === settings.owner && prevSettings.repo === settings.repo && prevSettings.path === settings.path
        const pendingBefore = queue?.snapshot.pending.length ?? 0
        if (queue && pendingBefore > 0 && sameRepo) {
          queue.replaceConfirmed(opened.value)
          queueClient = c
          queue.resume()
        } else {
          if (queue && pendingBefore > 0) {
            set({ lastFailure: { message: `다른 저장소로 연결해 저장하지 못한 변경 ${pendingBefore}건이 사라졌어요`, at: Date.now() } })
          }
          attachQueue(opened.value, c)
        }
        set({ settings })
        becomeReady(opened.value)
        return { ok: true }
      } catch (error) {
        if (error instanceof GithubAuthError) return { ok: false, message: '토큰을 확인해 주세요. 권한이 없거나 만료되었습니다' }
        if (error instanceof GithubError) return { ok: false, message: `GitHub 응답 ${error.status}. 소유자와 레포 이름을 확인해 주세요` }
        return { ok: false, message: '네트워크에 연결할 수 없습니다' }
      }
    },

    async reload() {
      const settings = get().settings
      if (!settings) return
      set({ status: 'loading' })
      await loadRemote(settings, get().vault !== null)
    },

    disconnect() {
      generation++
      clearSettings()
      clearCache()
      queue = null
      queueClient = null
      set({ ...initialState, online: get().online })
    },

    async flush() {
      await queue?.whenIdle()
    },

    setOnline(online) {
      set({ online })
      const { status, settings } = get()
      if (online && status === 'offline' && settings) void loadRemote(settings, true)
    },

    setTheme(theme) {
      applyTheme(theme)
      const settings = get().settings
      if (!settings) return
      const next = { ...settings, theme }
      saveSettings(next)
      set({ settings: next })
    },

    canWrite() {
      const { status, online } = get()
      if (!online) return { ok: false, message: '오프라인이라 저장할 수 없어요' }
      if (status === 'auth-error' || queue?.snapshot.status === 'paused-auth') return { ok: false, message: '토큰을 확인해 주세요' }
      if (status !== 'ready') return { ok: false, message: '지금은 저장할 수 없어요' }
      return { ok: true }
    },

    addLink(input) {
      const now = new Date().toISOString()
      const link: Link = { id: newLinkId(), ...input, pinned: false, createdAt: now, updatedAt: now }
      enqueue({ type: 'addLink', link })
      return link
    },

    updateLink(id, patch) {
      enqueue({ type: 'updateLink', id, patch, now: new Date().toISOString() })
    },

    deleteLink(id) {
      const link = get().vault?.links.find((l) => l.id === id)
      if (!link) return undefined
      enqueue({ type: 'deleteLink', id })
      return link
    },

    restoreLink(link) {
      enqueue({ type: 'addLink', link })
    },

    togglePin(id) {
      const link = get().vault?.links.find((l) => l.id === id)
      if (!link) return
      get().updateLink(id, { pinned: !link.pinned })
    },

    addTag(name, color) {
      const vault = get().vault ?? emptyVault()
      const existing = findTagByName(vault, name)
      if (existing) return existing
      const tag: Tag = { id: newTagId(), name: name.trim(), color: color ?? pickTagColor(vault) }
      enqueue({ type: 'addTag', tag })
      return tag
    },

    updateTag(id, patch) {
      enqueue({ type: 'updateTag', id, patch })
    },

    deleteTag(id) {
      enqueue({ type: 'deleteTag', id })
    },
  }
})

export function resetVaultStoreForTests(): void {
  queue = null
  queueClient = null
  generation = 0
  useVaultStore.setState({ ...initialState, online: true })
}
