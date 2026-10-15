import { describe, expect, it } from 'vitest'
import { emptyVault } from '@/vault/schema'
import { CACHE_KEY, SETTINGS_KEY, clearCache, clearSettings, loadCache, loadSettings, saveCache, saveSettings } from './settings'

describe('settings', () => {
  it('없으면 null', () => {
    expect(loadSettings()).toBeNull()
    expect(loadCache()).toBeNull()
  })
  it('저장하고 읽는다', () => {
    saveSettings({ owner: 'me', repo: 'r', path: 'links.json', token: 't', theme: 'dark' })
    expect(loadSettings()).toEqual({ owner: 'me', repo: 'r', path: 'links.json', token: 't', theme: 'dark' })
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!)).toMatchObject({ token: 't' })
  })
  it('빠진 필드는 기본값으로 채우고, 필수 필드가 없으면 null', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ owner: 'me', repo: 'r', token: 't' }))
    expect(loadSettings()).toEqual({ owner: 'me', repo: 'r', path: 'links.json', token: 't', theme: 'system' })
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ owner: 'me' }))
    expect(loadSettings()).toBeNull()
    localStorage.setItem(SETTINGS_KEY, '{broken')
    expect(loadSettings()).toBeNull()
  })
  it('캐시는 스키마를 통과해야 읽힌다', () => {
    saveCache({ vault: emptyVault(), sha: 's', fetchedAt: '2026-10-14T00:00:00.000Z' })
    expect(loadCache()).toEqual({ vault: emptyVault(), sha: 's', fetchedAt: '2026-10-14T00:00:00.000Z' })
    localStorage.setItem(CACHE_KEY, JSON.stringify({ vault: { version: 9 }, sha: 's', fetchedAt: 'x' }))
    expect(loadCache()).toBeNull()
  })
  it('clear는 키를 지운다', () => {
    saveSettings({ owner: 'me', repo: 'r', path: 'links.json', token: 't', theme: 'system' })
    saveCache({ vault: emptyVault(), sha: 's', fetchedAt: 'x' })
    clearSettings()
    clearCache()
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull()
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
  })
})
