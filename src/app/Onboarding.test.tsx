import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { Onboarding } from './Onboarding'

beforeEach(() => resetVaultStoreForTests())

describe('Onboarding', () => {
  it('세 단계와 GitHub 링크를 보여주고, 입력이 비면 연결 버튼이 비활성이다', () => {
    render(<Onboarding />)
    expect(screen.getByRole('heading', { name: 'SaveLink' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /새 레포/ })).toHaveAttribute('href', 'https://github.com/new?name=save-link-data&visibility=private')
    expect(screen.getByRole('link', { name: /토큰 발급 페이지/ })).toHaveAttribute('href', 'https://github.com/settings/personal-access-tokens/new')
    expect(screen.getByText(/Private를 선택/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '연결' })).toBeDisabled()
  })

  it('연결에 성공하면 connect를 입력값으로 호출한다', async () => {
    const connect = vi.fn().mockResolvedValue({ ok: true })
    useVaultStore.setState({ connect })
    render(<Onboarding />)
    await userEvent.type(screen.getByLabelText('GitHub 사용자명'), 'me')
    await userEvent.type(screen.getByLabelText('토큰'), 'github_pat_x')
    await userEvent.click(screen.getByRole('button', { name: '연결' }))
    await waitFor(() => expect(connect).toHaveBeenCalledWith({ owner: 'me', repo: 'save-link-data', path: 'links.json', token: 'github_pat_x' }))
  })

  it('실패 메시지를 alert로 보여준다', async () => {
    useVaultStore.setState({ connect: vi.fn().mockResolvedValue({ ok: false, message: '토큰을 확인해 주세요' }) })
    render(<Onboarding />)
    await userEvent.type(screen.getByLabelText('GitHub 사용자명'), 'me')
    await userEvent.type(screen.getByLabelText('토큰'), 'bad')
    await userEvent.click(screen.getByRole('button', { name: '연결' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('토큰을 확인해 주세요')
    expect(screen.getByRole('button', { name: '연결' })).toBeEnabled()
  })
})
