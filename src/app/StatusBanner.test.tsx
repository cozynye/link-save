import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { StatusBanner, bannerFor } from './StatusBanner'

const settings = { owner: 'me', repo: 'save-link-data', path: 'links.json', token: 't', theme: 'system' as const }

beforeEach(() => {
  resetUiStoreForTests()
  resetVaultStoreForTests()
})

describe('bannerFor', () => {
  it('ready와 loading은 null', () => {
    expect(bannerFor({ status: 'ready', errorDetail: null, settings, online: true })).toBeNull()
    expect(bannerFor({ status: 'loading', errorDetail: null, settings, online: true })).toBeNull()
  })
  it('온라인이 아니면 ready여도 오프라인 배너', () => {
    expect(bannerFor({ status: 'ready', errorDetail: null, settings, online: false })).toMatchObject({ tone: 'muted', title: '오프라인이라 읽기만 가능해요' })
    expect(bannerFor({ status: 'disconnected', errorDetail: null, settings: null, online: false })).toBeNull()
  })
  it('상태별 문구와 동작', () => {
    expect(bannerFor({ status: 'auth-error', errorDetail: null, settings, online: true })).toMatchObject({ tone: 'error', title: '토큰을 확인해 주세요', action: 'open-connection' })
    expect(bannerFor({ status: 'offline', errorDetail: null, settings, online: true })).toMatchObject({ tone: 'muted', title: '오프라인이라 읽기만 가능해요' })
    expect(bannerFor({ status: 'invalid-file', errorDetail: 'links.0.title: Too small', settings, online: true })).toMatchObject({ tone: 'error', title: '파일 형식이 올바르지 않습니다. GitHub에서 확인해 주세요', description: 'links.0.title: Too small', action: 'open-github' })
    expect(bannerFor({ status: 'unsupported-version', errorDetail: '2', settings, online: true })).toMatchObject({ tone: 'error', action: 'open-github' })
    expect(bannerFor({ status: 'oversize', errorDetail: null, settings, online: true })).toMatchObject({ tone: 'error', title: '파일이 1MB를 넘어 읽을 수 없습니다' })
    expect(bannerFor({ status: 'error', errorDetail: '네트워크에 연결할 수 없습니다', settings, online: true })).toMatchObject({ tone: 'warning', action: 'reload' })
  })
})

describe('StatusBanner', () => {
  it('auth-error면 설정 연결 탭을 여는 버튼이 있다', async () => {
    useVaultStore.setState({ status: 'auth-error', settings })
    render(<StatusBanner />)
    await userEvent.click(screen.getByRole('button', { name: '설정 열기' }))
    expect(useUiStore.getState()).toMatchObject({ settingsOpen: true, settingsTab: 'connection' })
  })
  it('error면 다시 시도 버튼이 reload를 부른다', async () => {
    const reload = vi.fn()
    useVaultStore.setState({ status: 'error', errorDetail: '네트워크에 연결할 수 없습니다', settings, reload })
    render(<StatusBanner />)
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(reload).toHaveBeenCalled()
  })
  it('invalid-file이면 GitHub 레포 링크가 있다', () => {
    useVaultStore.setState({ status: 'invalid-file', errorDetail: 'x', settings })
    render(<StatusBanner />)
    expect(screen.getByRole('link', { name: 'GitHub에서 열기' })).toHaveAttribute('href', 'https://github.com/me/save-link-data')
  })
  it('ready면 아무것도 그리지 않는다', () => {
    useVaultStore.setState({ status: 'ready', settings })
    const { container } = render(<StatusBanner />)
    expect(container).toBeEmptyDOMElement()
  })
})
