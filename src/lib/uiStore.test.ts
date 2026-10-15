import { beforeEach, describe, expect, it } from 'vitest'
import { resetUiStoreForTests, useUiStore } from './uiStore'

beforeEach(() => resetUiStoreForTests())

describe('uiStore', () => {
  it('태그 토글과 제거', () => {
    const s = useUiStore.getState()
    s.toggleTag('a')
    s.toggleTag('b')
    expect(useUiStore.getState().filter.tagIds).toEqual(['a', 'b'])
    s.toggleTag('a')
    expect(useUiStore.getState().filter.tagIds).toEqual(['b'])
    s.removeTagFromFilter('b')
    s.removeTagFromFilter('zzz')
    expect(useUiStore.getState().filter.tagIds).toEqual([])
  })
  it('resetFilter는 검색어, 태그, 고정을 모두 비운다', () => {
    const s = useUiStore.getState()
    s.setQuery('x')
    s.toggleTag('a')
    s.setPinnedOnly(true)
    s.resetFilter()
    expect(useUiStore.getState().filter).toEqual({ query: '', tagIds: [], pinnedOnly: false })
  })
  it('시트 상태는 서로 배타적으로 열린다', () => {
    const s = useUiStore.getState()
    s.openDetail('l1')
    s.openCapture('https://e.com/')
    expect(useUiStore.getState().detailId).toBeNull()
    expect(useUiStore.getState().captureUrl).toBe('https://e.com/')
    s.openSettings('tags')
    expect(useUiStore.getState().captureUrl).toBeNull()
    expect(useUiStore.getState().settingsTab).toBe('tags')
    s.closeSettings()
    expect(useUiStore.getState().settingsOpen).toBe(false)
  })
  it('openSettings 기본 탭은 connection', () => {
    useUiStore.getState().openSettings()
    expect(useUiStore.getState().settingsTab).toBe('connection')
  })
})
