import { GithubAuthError, GithubConflictError } from './github'
import { applyOp, applyOps, commitMessage, type Op } from './ops'
import { serializeVault, type Vault } from './schema'

export interface Confirmed {
  vault: Vault
  sha: string
}

export type QueueStatus = 'idle' | 'writing' | 'paused-auth'

export interface QueueSnapshot {
  confirmed: Confirmed
  pending: readonly Op[]
  status: QueueStatus
}

export interface QueueIO {
  read(): Promise<{ text: string; sha: string }>
  write(text: string, message: string, sha: string): Promise<{ sha: string }>
  parse(text: string): Vault
}

export interface QueueEvents {
  onChange(snapshot: QueueSnapshot): void
  onFailure(op: Op, error: unknown): void
  onAuthError(error: unknown): void
}

export const MAX_CONFLICT_RETRIES = 2

type CommitOutcome = 'ok' | 'failed' | 'paused'

export class WriteQueue {
  private confirmed: Confirmed
  private pending: Op[] = []
  private status: QueueStatus = 'idle'
  private draining: Promise<void> | null = null

  constructor(
    initial: Confirmed,
    private readonly io: QueueIO,
    private readonly events: QueueEvents,
  ) {
    this.confirmed = initial
  }

  get snapshot(): QueueSnapshot {
    return { confirmed: this.confirmed, pending: [...this.pending], status: this.status }
  }

  get view(): Vault {
    return applyOps(this.confirmed.vault, this.pending)
  }

  enqueue(op: Op): void {
    this.pending.push(op)
    this.emit()
    void this.drain()
  }

  replaceConfirmed(confirmed: Confirmed): void {
    this.confirmed = confirmed
    this.emit()
  }

  resume(): void {
    if (this.status !== 'paused-auth') return
    this.status = 'idle'
    this.emit()
    void this.drain()
  }

  /** 테스트와 종료 처리용: 현재 드레인이 끝날 때까지 기다린다. */
  async whenIdle(): Promise<void> {
    while (this.draining) await this.draining
  }

  private emit(): void {
    this.events.onChange(this.snapshot)
  }

  private drain(): Promise<void> {
    if (this.draining) return this.draining
    if (this.status === 'paused-auth') return Promise.resolve()
    this.draining = this.runLoop().finally(() => {
      this.draining = null
    })
    return this.draining
  }

  private async runLoop(): Promise<void> {
    while (this.pending.length > 0) {
      const op = this.pending[0]
      this.status = 'writing'
      this.emit()
      const outcome = await this.commit(op)
      if (outcome === 'paused') {
        this.status = 'paused-auth'
        this.emit()
        return
      }
      this.pending.shift()
      this.status = 'idle'
      this.emit()
    }
  }

  private async commit(op: Op): Promise<CommitOutcome> {
    for (let attempt = 0; attempt <= MAX_CONFLICT_RETRIES; attempt++) {
      const next = applyOp(this.confirmed.vault, op)
      const message = commitMessage(op, this.confirmed.vault)
      try {
        const { sha } = await this.io.write(serializeVault(next), message, this.confirmed.sha)
        this.confirmed = { vault: next, sha }
        return 'ok'
      } catch (error) {
        if (error instanceof GithubAuthError) {
          this.events.onAuthError(error)
          return 'paused'
        }
        if (error instanceof GithubConflictError && attempt < MAX_CONFLICT_RETRIES) {
          try {
            const latest = await this.io.read()
            this.confirmed = { vault: this.io.parse(latest.text), sha: latest.sha }
            continue
          } catch (readError) {
            if (readError instanceof GithubAuthError) {
              this.events.onAuthError(readError)
              return 'paused'
            }
            this.events.onFailure(op, readError)
            return 'failed'
          }
        }
        this.events.onFailure(op, error)
        return 'failed'
      }
    }
    return 'failed'
  }
}
