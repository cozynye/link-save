import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { fetchMetadata } from '@/metadata/fetchMetadata'
import { emptyVault, type Link, type Vault } from '@/vault/schema'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { DetailSheet } from './DetailSheet'

vi.mock('@/metadata/fetchMetadata', () => ({ fetchMetadata: vi.fn() }))
const mockedFetch = vi.mocked(fetchMetadata)

const link: Link = {
  id: 'l1', url: 'https://example.com/a', title: '원래 제목', description: '원래 설명', note: '원래 메모', image: null, siteName: 'example.com',
  tags: ['a'], pinned: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z',
}
const other: Link = { ...link, id: 'l2', url: 'https://example.com/b', title: '다른 글' }
const vault: Vault = { ...emptyVault(), tags: [{ id: 'a', name: 'AI', color: 'violet' }, { id: 'b', name: 'CSS', color: 'pink' }], links: [link, other] }
const user = userEvent.setup({ pointerEventsCheck: 0 })

beforeEach(() => {
  resetUiStoreForTests()
  resetVaultStoreForTests()
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} }))
  useVaultStore.setState({
    vault, status: 'ready', canWrite: () => ({ ok: true }),
    updateLink: vi.fn(), togglePin: vi.fn(), deleteLink: vi.fn(() => link), restoreLink: vi.fn(),
    addTag: vi.fn((name: string) => ({ id: `id-${name}`, name, color: 'red' as const })),
  })
  useUiStore.getState().openDetail('l1')
})
afterEach(() => {
  vi.unstubAllGlobals()
  mockedFetch.mockReset()
})

describe('DetailSheet', () => {
  it('값을 보여주고 변경이 없으면 저장이 비활성이다', () => {
    render(<DetailSheet />)
    expect(screen.getByLabelText('제목')).toHaveValue('원래 제목')
    expect(screen.getByLabelText('주소')).toHaveValue('https://example.com/a')
    expect(screen.getByLabelText('노트')).toHaveValue('원래 메모')
    expect(screen.getByText('원래 설명')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('바뀐 필드만 updateLink로 보낸다', async () => {
    render(<DetailSheet />)
    await user.clear(screen.getByLabelText('노트'))
    await user.type(screen.getByLabelText('노트'), '새 메모 ')
    await user.click(screen.getByRole('button', { name: /CSS/ }))
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(useVaultStore.getState().updateLink).toHaveBeenCalledWith('l1', { note: '새 메모', tags: ['a', 'b'] })
    expect(useUiStore.getState().detailId).toBeNull()
  })

  it('주소를 다른 링크와 같게 바꾸면 저장을 막는다', async () => {
    render(<DetailSheet />)
    await user.clear(screen.getByLabelText('주소'))
    await user.type(screen.getByLabelText('주소'), 'https://example.com/b/')
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(screen.getByRole('alert')).toHaveTextContent('이미 저장된 링크예요')
    expect(useVaultStore.getState().updateLink).not.toHaveBeenCalled()
  })

  it('다시 가져오기는 제목·설명·이미지만 바꾸고 노트는 두며, 저장 전까지 반영하지 않는다', async () => {
    mockedFetch.mockResolvedValue({ title: '새 OG 제목', description: '새 OG 설명', image: 'https://example.com/new.png', siteName: 'Example' })
    render(<DetailSheet />)
    await user.click(screen.getByRole('button', { name: '다시 가져오기' }))
    await waitFor(() => expect(screen.getByLabelText('제목')).toHaveValue('새 OG 제목'))
    expect(screen.getByText('새 OG 설명')).toBeInTheDocument()
    expect(screen.getByLabelText('노트')).toHaveValue('원래 메모')
    expect(useVaultStore.getState().updateLink).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(useVaultStore.getState().updateLink).toHaveBeenCalledWith('l1', {
      title: '새 OG 제목', description: '새 OG 설명', image: 'https://example.com/new.png', siteName: 'Example',
    })
  })

  it('고정은 즉시 togglePin을 부른다', async () => {
    render(<DetailSheet />)
    await user.click(screen.getByRole('button', { name: '고정' }))
    expect(useVaultStore.getState().togglePin).toHaveBeenCalledWith('l1')
  })

  it('삭제는 확인을 거쳐 deleteLink를 부르고 시트를 닫는다', async () => {
    render(<DetailSheet />)
    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '삭제하기' }))
    expect(useVaultStore.getState().deleteLink).toHaveBeenCalledWith('l1')
    expect(useUiStore.getState().detailId).toBeNull()
  })
})
