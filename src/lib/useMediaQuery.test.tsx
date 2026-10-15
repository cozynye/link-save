import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useIsDesktop, useMediaQuery } from './useMediaQuery'

function stubMatchMedia(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
    get matches() { return matches },
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  })))
  return { set(next: boolean) { matches = next; listeners.forEach((cb) => cb()) }, listeners }
}

afterEach(() => vi.unstubAllGlobals())

describe('useMediaQuery', () => {
  it('현재 값을 돌려주고 변경을 반영한다', () => {
    const mq = stubMatchMedia(false)
    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
    act(() => mq.set(true))
    expect(result.current).toBe(true)
    unmount()
    expect(mq.listeners.size).toBe(0)
  })
  it('useIsDesktop은 768px 기준이다', () => {
    const spy = stubMatchMedia(true)
    const { result } = renderHook(() => useIsDesktop())
    expect(result.current).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)')
    void spy
  })
})
