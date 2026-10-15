import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { emptyVault, type Link, type Vault } from '@/vault/schema'
import { TagSidebar } from './TagSidebar'

const mk = (id: string, tags: string[], pinned = false): Link => ({
  id, url: `https://e.com/${id}`, title: id, description: '', note: '', image: null, siteName: '', tags, pinned,
  createdAt: `2026-01-0${id}T00:00:00.000Z`, updatedAt: `2026-01-0${id}T00:00:00.000Z`,
})
const vault: Vault = {
  ...emptyVault(),
  tags: [{ id: 'a', name: 'AI', color: 'violet' }, { id: 'b', name: 'CSS', color: 'pink' }],
  links: [mk('1', ['a'], true), mk('2', ['a', 'b']), mk('3', ['b'])],
}

beforeEach(() => resetUiStoreForTests())

describe('TagSidebar', () => {
  it('전체·고정됨·태그와 개수를 보여주고 토글한다', async () => {
    render(<TagSidebar vault={vault} />)
    expect(screen.getByRole('button', { name: /전체.*3/ })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /고정됨.*1/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /CSS.*2/ }))
    expect(useUiStore.getState().filter.tagIds).toEqual(['b'])
    expect(screen.getByRole('button', { name: /전체/ })).not.toHaveAttribute('aria-current', 'true')
    await userEvent.click(screen.getByRole('button', { name: /전체/ }))
    expect(useUiStore.getState().filter.tagIds).toEqual([])
  })
  it('태그 관리 버튼은 설정의 태그 탭을 연다', async () => {
    render(<TagSidebar vault={vault} />)
    await userEvent.click(screen.getByRole('button', { name: '태그 관리' }))
    expect(useUiStore.getState()).toMatchObject({ settingsOpen: true, settingsTab: 'tags' })
  })
})
