import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { emptyVault, type Link, type Vault } from '@/vault/schema'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { LinkGrid } from './LinkGrid'

const mk = (id: string, over: Partial<Link> = {}): Link => ({
  id, url: `https://example.com/${id}`, title: `제목 ${id}`, description: '', note: '', image: null, siteName: 'example.com',
  tags: [], pinned: false, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', ...over,
})
const vault: Vault = { ...emptyVault(), tags: [{ id: 't1', name: 'AI', color: 'violet' }], links: [mk('a', { tags: ['t1', 'ghost'] }), mk('b', { pinned: true })] }

function stubDesktop(isDesktop: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: isDesktop, addEventListener() {}, removeEventListener() {} }))
}

beforeEach(() => {
  resetUiStoreForTests()
  resetVaultStoreForTests()
  useVaultStore.setState({ vault, status: 'ready' })
})
afterEach(() => vi.unstubAllGlobals())

describe('LinkGrid', () => {
  it('링크가 하나도 없으면 안내를 보여준다', () => {
    stubDesktop(false)
    render(<LinkGrid links={[]} totalCount={0} />)
    expect(screen.getByText('아직 저장한 링크가 없어요')).toBeInTheDocument()
  })
  it('필터 결과가 없으면 초기화 버튼을 보여주고 누르면 필터가 비워진다', async () => {
    stubDesktop(false)
    useUiStore.getState().setQuery('없는검색어')
    render(<LinkGrid links={[]} totalCount={2} />)
    expect(screen.getByText('조건에 맞는 링크가 없어요')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '필터 초기화' }))
    expect(useUiStore.getState().filter.query).toBe('')
  })
  it('모바일에서는 행으로, 존재하는 태그만 칩으로 보여주고 탭하면 상세를 연다', async () => {
    stubDesktop(false)
    render(<LinkGrid links={vault.links} totalCount={2} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.queryByText('ghost')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /제목 a/ }))
    expect(useUiStore.getState().detailId).toBe('a')
  })
  it('데스크톱에서는 카드로 보여주고 고정 버튼은 togglePin을 부른다', async () => {
    stubDesktop(true)
    const togglePin = vi.fn()
    useVaultStore.setState({ togglePin, canWrite: () => ({ ok: true }) })
    render(<LinkGrid links={vault.links} totalCount={2} />)
    expect(screen.getAllByRole('article')).toHaveLength(2)
    await userEvent.click(screen.getAllByRole('button', { name: '고정' })[0])
    expect(togglePin).toHaveBeenCalledWith('a')
  })
})
