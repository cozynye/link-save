import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { AppearancePanel } from './AppearancePanel'

beforeEach(() => {
  resetVaultStoreForTests()
  useVaultStore.setState({ settings: { owner: 'me', repo: 'r', path: 'links.json', token: 't', theme: 'system' }, setTheme: vi.fn() })
})

describe('AppearancePanel', () => {
  it('현재 테마가 선택되어 있고 바꾸면 setTheme', async () => {
    render(<AppearancePanel />)
    expect(screen.getByRole('radio', { name: '시스템' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: '다크' }))
    expect(useVaultStore.getState().setTheme).toHaveBeenCalledWith('dark')
  })
})
