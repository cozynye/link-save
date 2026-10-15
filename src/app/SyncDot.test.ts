import { describe, expect, it } from 'vitest'
import { syncDotState } from './SyncDot'

describe('syncDotState', () => {
  it('상태를 네 가지 톤으로 묶는다', () => {
    expect(syncDotState('ready', 0, false, true)).toEqual({ tone: 'ok', label: '동기화됨' })
    expect(syncDotState('ready', 2, false, true)).toEqual({ tone: 'busy', label: '동기화 중' })
    expect(syncDotState('ready', 0, true, true).tone).toBe('busy')
    expect(syncDotState('loading', 0, false, true).tone).toBe('busy')
    expect(syncDotState('offline', 0, false, true)).toEqual({ tone: 'muted', label: '오프라인' })
    for (const status of ['auth-error', 'error', 'invalid-file', 'unsupported-version', 'oversize'] as const) {
      expect(syncDotState(status, 0, false, true).tone).toBe('error')
    }
  })

  it('브라우저가 오프라인이면 status가 ready여도 muted/오프라인이다', () => {
    expect(syncDotState('ready', 0, false, false)).toEqual({ tone: 'muted', label: '오프라인' })
  })

  it('오프라인이어도 에러 상태는 우선한다', () => {
    expect(syncDotState('auth-error', 0, false, false)).toEqual({ tone: 'error', label: '동기화 문제' })
  })
})
