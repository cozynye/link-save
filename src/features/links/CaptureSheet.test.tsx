import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { fetchMetadata } from '@/metadata/fetchMetadata'
import { emptyVault, type Link, type Vault } from '@/vault/schema'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { CaptureSheet } from './CaptureSheet'

vi.mock('@/metadata/fetchMetadata', () => ({ fetchMetadata: vi.fn() }))
const mockedFetch = vi.mocked(fetchMetadata)
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockedToast = vi.mocked(toast)

const existing: Link = {
  id: 'dup', url: 'https://example.com/dup', title: '이미 있음', description: '', note: '', image: null, siteName: 'example.com',
  tags: [], pinned: false, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
}
const vault: Vault = { ...emptyVault(), tags: [{ id: 'a', name: 'AI', color: 'violet' }], links: [existing] }

beforeEach(() => {
  resetUiStoreForTests()
  resetVaultStoreForTests()
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} }))
  useVaultStore.setState({
    vault,
    status: 'ready',
    canWrite: () => ({ ok: true }),
    addLink: vi.fn((input) => ({ ...input, id: 'new', pinned: false, createdAt: 'x', updatedAt: 'x' })),
    addTag: vi.fn((name: string) => ({ id: `id-${name}`, name, color: 'red' as const })),
    deleteLink: vi.fn(),
  })
})
afterEach(() => {
  vi.unstubAllGlobals()
  mockedFetch.mockReset()
})

describe('CaptureSheet', () => {
  it('OG를 채우고 태그·노트와 함께 저장한다', async () => {
    mockedFetch.mockResolvedValue({ title: 'OG 제목', description: 'OG 설명', image: 'https://example.com/og.png', siteName: 'Example' })
    useUiStore.getState().openCapture('https://example.com/new')
    render(<CaptureSheet />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('제목')).toHaveValue('OG 제목'))
    expect(screen.getByText('OG 설명')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('노트'), '  왜 저장했는지  ')
    await userEvent.click(screen.getByRole('button', { name: /AI/ }))
    await userEvent.type(screen.getByLabelText('새 태그'), 'Vue{enter}')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    const { addTag, addLink } = useVaultStore.getState()
    expect(addTag).toHaveBeenCalledWith('Vue')
    expect(addLink).toHaveBeenCalledWith({
      url: 'https://example.com/new', title: 'OG 제목', description: 'OG 설명', note: '왜 저장했는지',
      image: 'https://example.com/og.png', siteName: 'Example', tags: ['a', 'id-Vue'],
    })
    expect(useUiStore.getState().captureUrl).toBeNull()
  })

  it('중복이면 안내와 열기 버튼을 보여주고 저장을 막는다', async () => {
    useUiStore.getState().openCapture('https://example.com/dup')
    render(<CaptureSheet />)
    expect(screen.getByText('이미 저장된 링크예요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull()
    expect(mockedFetch).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: '열기' }))
    expect(useUiStore.getState().detailId).toBe('dup')
    expect(useUiStore.getState().captureUrl).toBeNull()
  })

  it('OG 실패 시 안내를 보이고 호스트명을 제목으로 저장한다', async () => {
    mockedFetch.mockResolvedValue(null)
    useUiStore.getState().openCapture('https://www.blog.dev/post')
    render(<CaptureSheet />)
    expect(await screen.findByText('정보를 가져오지 못했어요')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(useVaultStore.getState().addLink).toHaveBeenCalledWith(expect.objectContaining({ title: 'blog.dev', siteName: 'blog.dev', image: null }))
  })

  it('사용자가 고친 제목은 OG 도착 후에도 덮어쓰지 않는다', async () => {
    let resolve!: (v: Awaited<ReturnType<typeof fetchMetadata>>) => void
    mockedFetch.mockReturnValue(new Promise((r) => { resolve = r }))
    useUiStore.getState().openCapture('https://example.com/slow')
    render(<CaptureSheet />)
    await userEvent.type(screen.getByLabelText('제목'), '내 제목')
    resolve({ title: 'OG', description: '', image: null, siteName: 'e' })
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled())
    expect(screen.getByLabelText('제목')).toHaveValue('내 제목')
  })

  it('저장 후 실행 취소 시점에 canWrite가 거절하면 deleteLink를 부르지 않고 에러 토스트를 띄운다', async () => {
    mockedFetch.mockResolvedValue(null)
    useUiStore.getState().openCapture('https://www.blog.dev/post')
    render(<CaptureSheet />)
    await screen.findByText('정보를 가져오지 못했어요')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    const lastCall = mockedToast.success.mock.calls.at(-1)
    const actionValue = lastCall?.[1]?.action
    const onClick = actionValue && typeof actionValue === 'object' && 'onClick' in actionValue ? actionValue.onClick : undefined
    expect(typeof onClick).toBe('function')

    useVaultStore.setState({ canWrite: () => ({ ok: false, message: '지금은 저장할 수 없어요' }) })
    ;(onClick as () => void)()

    expect(useVaultStore.getState().deleteLink).not.toHaveBeenCalled()
    expect(mockedToast.error).toHaveBeenCalledWith('지금은 저장할 수 없어요')
  })
})
