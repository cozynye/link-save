import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { emptyVault, type Link, type Vault } from '@/vault/schema'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { TagManager } from './TagManager'

const mk = (id: string, tags: string[]): Link => ({
  id, url: `https://e.com/${id}`, title: id, description: '', note: '', image: null, siteName: '', tags, pinned: false,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})
const vault: Vault = {
  ...emptyVault(),
  tags: [{ id: 'a', name: 'AI', color: 'violet' }, { id: 'b', name: 'CSS', color: 'pink' }],
  links: [mk('1', ['a']), mk('2', ['a', 'b'])],
}
const user = userEvent.setup({ pointerEventsCheck: 0 })

beforeEach(() => {
  resetUiStoreForTests()
  resetVaultStoreForTests()
  useVaultStore.setState({ vault, status: 'ready', canWrite: () => ({ ok: true }), updateTag: vi.fn(), deleteTag: vi.fn(), addTag: vi.fn() })
})

describe('TagManager', () => {
  it('이름을 고치고 Enter하면 updateTag', async () => {
    render(<TagManager vault={vault} />)
    const name = screen.getByLabelText('AI 이름')
    await user.clear(name)
    await user.type(name, '인공지능{enter}')
    expect(useVaultStore.getState().updateTag).toHaveBeenCalledWith('a', { name: '인공지능' })
  })
  it('다른 태그와 같은 이름으로는 바꾸지 못한다', async () => {
    render(<TagManager vault={vault} />)
    const name = screen.getByLabelText('AI 이름')
    await user.clear(name)
    await user.type(name, 'css{enter}')
    expect(useVaultStore.getState().updateTag).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('이미 있는 태그예요')
  })
  it('색을 바꾸면 updateTag', async () => {
    render(<TagManager vault={vault} />)
    await user.selectOptions(screen.getByLabelText('AI 색'), 'blue')
    expect(useVaultStore.getState().updateTag).toHaveBeenCalledWith('a', { color: 'blue' })
  })
  it('삭제는 사용 개수를 보여주고 확인 후 deleteTag와 필터 제거를 한다', async () => {
    useUiStore.getState().toggleTag('a')
    render(<TagManager vault={vault} />)
    await user.click(screen.getByRole('button', { name: 'AI 삭제' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('링크 2개')
    await user.click(screen.getByRole('button', { name: '삭제하기' }))
    expect(useVaultStore.getState().deleteTag).toHaveBeenCalledWith('a')
    expect(useUiStore.getState().filter.tagIds).toEqual([])
  })
  it('새 태그 추가', async () => {
    render(<TagManager vault={vault} />)
    await user.type(screen.getByLabelText('새 태그 이름'), 'Vue{enter}')
    expect(useVaultStore.getState().addTag).toHaveBeenCalledWith('Vue')
  })
})
