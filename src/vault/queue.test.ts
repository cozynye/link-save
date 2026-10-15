import { describe, expect, it, vi } from 'vitest'
import { GithubAuthError, GithubConflictError, GithubError } from './github'
import type { Op } from './ops'
import { emptyVault, parseVault, serializeVault, type Link, type Vault } from './schema'
import { MAX_CONFLICT_RETRIES, WriteQueue, type QueueIO } from './queue'

const mkLink = (id: string, title = id): Link => ({
  id, url: `https://e.com/${id}`, title, description: '', note: '', image: null, siteName: 'e.com', tags: [], pinned: false,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})
const add = (id: string): Op => ({ type: 'addLink', link: mkLink(id) })

function parse(text: string): Vault {
  const r = parseVault(text)
  if (!r.ok) throw new Error(r.reason)
  return r.vault
}

/** GitHub 흉내: 현재 파일과 sha를 들고 있고, sha가 맞을 때만 쓴다. */
function fakeRemote(initial: Vault) {
  let text = serializeVault(initial)
  let sha = 'sha-0'
  let counter = 0
  const io: QueueIO = {
    read: vi.fn(async () => ({ text, sha })),
    write: vi.fn(async (nextText: string, _message: string, givenSha: string) => {
      if (givenSha !== sha) throw new GithubConflictError()
      text = nextText
      sha = `sha-${++counter}`
      return { sha }
    }),
    parse,
  }
  return {
    io,
    get vault() { return parse(text) },
    get sha() { return sha },
    /** 다른 기기가 먼저 쓴 상황을 만든다 */
    externalWrite(mutate: (v: Vault) => Vault) {
      text = serializeVault(mutate(parse(text)))
      sha = `sha-ext-${++counter}`
    },
  }
}

function makeQueue(remote: ReturnType<typeof fakeRemote>, overrides: Partial<QueueIO> = {}) {
  const events = { onChange: vi.fn(), onFailure: vi.fn(), onAuthError: vi.fn() }
  const queue = new WriteQueue({ vault: remote.vault, sha: remote.sha }, { ...remote.io, ...overrides }, events)
  return { queue, events }
}

describe('WriteQueue', () => {
  it('연산을 낙관적으로 view에 반영하고 순서대로 커밋한다', async () => {
    const remote = fakeRemote(emptyVault())
    const { queue, events } = makeQueue(remote)
    queue.enqueue(add('a'))
    queue.enqueue(add('b'))
    expect(queue.view.links.map((l) => l.id)).toEqual(['b', 'a'])
    expect(queue.snapshot.pending).toHaveLength(2)
    await queue.whenIdle()
    expect(remote.vault.links.map((l) => l.id)).toEqual(['b', 'a'])
    expect(queue.snapshot.pending).toHaveLength(0)
    expect(queue.snapshot.confirmed.sha).toBe(remote.sha)
    expect(events.onChange).toHaveBeenCalled()
    expect(events.onFailure).not.toHaveBeenCalled()
    const messages = (remote.io.write as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1])
    expect(messages).toEqual(['Add link: a', 'Add link: b'])
  })

  it('409가 나면 최신본을 읽어 재적용하고 다시 쓴다', async () => {
    const remote = fakeRemote(emptyVault())
    const { queue, events } = makeQueue(remote)
    remote.externalWrite((v) => ({ ...v, links: [mkLink('ext')] }))
    queue.enqueue(add('mine'))
    await queue.whenIdle()
    expect(remote.vault.links.map((l) => l.id)).toEqual(['mine', 'ext'])
    expect(remote.io.read).toHaveBeenCalledTimes(1)
    expect(events.onFailure).not.toHaveBeenCalled()
  })

  it('충돌 재시도를 소진하면 그 연산만 버리고 다음 연산을 계속한다', async () => {
    const remote = fakeRemote(emptyVault())
    let writes = 0
    const { queue, events } = makeQueue(remote, {
      write: vi.fn(async (text: string, message: string, sha: string) => {
        writes++
        if (writes <= MAX_CONFLICT_RETRIES + 1) throw new GithubConflictError()
        return remote.io.write(text, message, sha)
      }),
    })
    queue.enqueue(add('doomed'))
    queue.enqueue(add('next'))
    await queue.whenIdle()
    expect(events.onFailure).toHaveBeenCalledTimes(1)
    expect((events.onFailure.mock.calls[0][0] as Op)).toEqual(add('doomed'))
    expect(remote.vault.links.map((l) => l.id)).toEqual(['next'])
    expect(queue.view.links.map((l) => l.id)).toEqual(['next'])
  })

  it('409 후 재읽기에서 403이면 일시정지하고 pending을 유지한다', async () => {
    const remote = fakeRemote(emptyVault())
    const { queue, events } = makeQueue(remote, {
      read: vi.fn().mockRejectedValue(new GithubAuthError(403)),
    })
    remote.externalWrite((v) => ({ ...v, links: [mkLink('ext')] }))
    queue.enqueue(add('mine'))
    await queue.whenIdle()
    expect(queue.snapshot.status).toBe('paused-auth')
    expect(queue.snapshot.pending).toHaveLength(1)
    expect(events.onAuthError).toHaveBeenCalledTimes(1)
    expect(events.onFailure).not.toHaveBeenCalled()
  })

  it('401이면 일시정지하고 pending을 유지하며, resume 후 이어서 쓴다', async () => {
    const remote = fakeRemote(emptyVault())
    let failOnce = true
    const { queue, events } = makeQueue(remote, {
      write: vi.fn(async (text: string, message: string, sha: string) => {
        if (failOnce) { failOnce = false; throw new GithubAuthError(401) }
        return remote.io.write(text, message, sha)
      }),
    })
    queue.enqueue(add('kept'))
    await queue.whenIdle()
    expect(queue.snapshot.status).toBe('paused-auth')
    expect(queue.snapshot.pending).toHaveLength(1)
    expect(queue.view.links.map((l) => l.id)).toEqual(['kept'])
    expect(events.onAuthError).toHaveBeenCalledTimes(1)
    expect(remote.vault.links).toHaveLength(0)

    queue.enqueue(add('later'))
    expect(queue.snapshot.pending).toHaveLength(2)
    queue.resume()
    await queue.whenIdle()
    expect(queue.snapshot.status).toBe('idle')
    expect(remote.vault.links.map((l) => l.id)).toEqual(['later', 'kept'])
  })

  it('그 외 오류는 연산을 버리고 onFailure로 알린다', async () => {
    const remote = fakeRemote(emptyVault())
    const { queue, events } = makeQueue(remote, { write: vi.fn().mockRejectedValue(new GithubError(500, 'boom')) })
    queue.enqueue(add('x'))
    await queue.whenIdle()
    expect(events.onFailure).toHaveBeenCalledTimes(1)
    expect(queue.view.links).toEqual([])
    expect(queue.snapshot.status).toBe('idle')
  })

  it('replaceConfirmed는 확정 상태를 바꾸고 pending은 그 위에 다시 적용된다', () => {
    const remote = fakeRemote(emptyVault())
    const { queue } = makeQueue(remote, { write: vi.fn(() => new Promise<{ sha: string }>(() => {})) })
    queue.enqueue(add('p'))
    queue.replaceConfirmed({ vault: { ...emptyVault(), links: [mkLink('c')] }, sha: 'sha-c' })
    expect(queue.view.links.map((l) => l.id)).toEqual(['p', 'c'])
  })
})
