import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { ConnectionPanel } from './ConnectionPanel'

const user = userEvent.setup({ pointerEventsCheck: 0 })

beforeEach(() => {
  resetUiStoreForTests()
  resetVaultStoreForTests()
  useVaultStore.setState({
    status: 'ready',
    settings: { owner: 'me', repo: 'save-link-data', path: 'links.json', token: 'old', theme: 'system' },
    connect: vi.fn().mockResolvedValue({ ok: true }),
    disconnect: vi.fn(),
  })
  useUiStore.getState().openSettings('connection')
})

describe('ConnectionPanel', () => {
  it('토큰을 비워 두고 재연결하면 기존 토큰을 쓴다', async () => {
    render(<ConnectionPanel />)
    expect(screen.getByLabelText('GitHub 사용자명')).toHaveValue('me')
    await user.click(screen.getByRole('button', { name: '재연결' }))
    expect(useVaultStore.getState().connect).toHaveBeenCalledWith({ owner: 'me', repo: 'save-link-data', path: 'links.json', token: 'old' })
  })
  it('새 토큰을 넣으면 그 토큰으로 연결한다', async () => {
    render(<ConnectionPanel />)
    await user.type(screen.getByLabelText('새 토큰'), 'fresh')
    await user.click(screen.getByRole('button', { name: '재연결' }))
    expect(useVaultStore.getState().connect).toHaveBeenCalledWith(expect.objectContaining({ token: 'fresh' }))
  })
  it('연결 해제는 확인 후 disconnect와 설정 닫기', async () => {
    render(<ConnectionPanel />)
    await user.click(screen.getByRole('button', { name: '연결 해제' }))
    await user.click(screen.getByRole('button', { name: '해제하기' }))
    expect(useVaultStore.getState().disconnect).toHaveBeenCalled()
    expect(useUiStore.getState().settingsOpen).toBe(false)
  })
})
