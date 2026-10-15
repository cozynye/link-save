import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSettings } from '@/lib/settings'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { encodeBase64Utf8 } from '@/vault/github'
import { emptyVault, serializeVault } from '@/vault/schema'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import App from './App'

beforeEach(() => {
  resetVaultStoreForTests()
  resetUiStoreForTests()
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} }))
})
afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('설정이 없으면 온보딩을 보여준다', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'SaveLink' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '연결' })).toBeInTheDocument()
  })
  it('설정이 있으면 메인을 보여준다', async () => {
    saveSettings({ owner: 'me', repo: 'r', path: 'links.json', token: 't', theme: 'system' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: encodeBase64Utf8(serializeVault(emptyVault())), sha: 's', size: 10 }), { status: 200 })))
    render(<App />)
    expect(await screen.findByLabelText('링크 붙여 넣기')).toBeInTheDocument()
    expect(await screen.findByText('아직 저장한 링크가 없어요')).toBeInTheDocument()
  })
  it('?url= 딥링크는 주소에서 지우고 준비되면 캡처 시트를 연다', async () => {
    saveSettings({ owner: 'me', repo: 'r', path: 'links.json', token: 't', theme: 'system' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: encodeBase64Utf8(serializeVault(emptyVault())), sha: 's', size: 10 }), { status: 200 })))
    window.history.replaceState(null, '', `/?url=${encodeURIComponent('https://ex.com/p?a=1&b=2')}`)
    render(<App />)
    await waitFor(() => expect(useUiStore.getState().captureUrl).toBe('https://ex.com/p?a=1&b=2'))
    expect(window.location.search).toBe('')
  })
  it('저장 중(pendingCount > 0)이면 beforeunload를 막고, 아니면 막지 않는다', async () => {
    saveSettings({ owner: 'me', repo: 'r', path: 'links.json', token: 't', theme: 'system' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: encodeBase64Utf8(serializeVault(emptyVault())), sha: 's', size: 10 }), { status: 200 })))
    render(<App />)
    await screen.findByLabelText('링크 붙여 넣기')

    useVaultStore.setState({ pendingCount: 1 })
    const blocked = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(blocked)
    expect(blocked.defaultPrevented).toBe(true)

    useVaultStore.setState({ pendingCount: 0 })
    const allowed = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(allowed)
    expect(allowed.defaultPrevented).toBe(false)
  })
})
