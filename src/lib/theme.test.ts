import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, resolveTheme, watchSystemTheme } from './theme'

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  const mq = {
    matches,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mq))
  return { fire: () => listeners.forEach((cb) => cb()), listeners }
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
})

describe('resolveTheme', () => {
  it('system은 OS 설정을 따른다', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
  it('명시된 값은 그대로 쓴다', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')
  })
})

describe('applyTheme', () => {
  it('html에 data-theme와 color-scheme를 설정한다', () => {
    stubMatchMedia(true)
    expect(applyTheme('system')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})

describe('watchSystemTheme', () => {
  it('변경 이벤트를 구독하고 해제한다', () => {
    const { fire, listeners } = stubMatchMedia(false)
    const onChange = vi.fn()
    const stop = watchSystemTheme(onChange)
    fire()
    expect(onChange).toHaveBeenCalledTimes(1)
    stop()
    expect(listeners.size).toBe(0)
  })
})
