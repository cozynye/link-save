import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { emptyVault, type Vault } from '@/vault/schema'
import { TagPicker } from './TagPicker'

const vault: Vault = { ...emptyVault(), tags: [{ id: 'a', name: 'AI', color: 'violet' }, { id: 'b', name: 'CSS', color: 'pink' }] }

describe('TagPicker', () => {
  it('기존 태그를 토글한다', async () => {
    const onChange = vi.fn()
    render(<TagPicker vault={vault} value={{ selectedIds: ['a'], draftNames: [] }} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /AI/ })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: /CSS/ }))
    expect(onChange).toHaveBeenCalledWith({ selectedIds: ['a', 'b'], draftNames: [] })
  })
  it('새 이름을 Enter하면 초안에 추가하고, 기존 이름이면 그 태그를 선택한다', async () => {
    const onChange = vi.fn()
    render(<TagPicker vault={vault} value={{ selectedIds: [], draftNames: [] }} onChange={onChange} />)
    const input = screen.getByLabelText('새 태그')
    await userEvent.type(input, 'Vue{enter}')
    expect(onChange).toHaveBeenLastCalledWith({ selectedIds: [], draftNames: ['Vue'] })
    expect(input).toHaveValue('')
    await userEvent.type(input, ' css {enter}')
    expect(onChange).toHaveBeenLastCalledWith({ selectedIds: ['b'], draftNames: [] })
  })
  it('초안 태그는 선택된 칩으로 보이고 다시 누르면 빠진다', async () => {
    const onChange = vi.fn()
    render(<TagPicker vault={vault} value={{ selectedIds: [], draftNames: ['Vue'] }} onChange={onChange} />)
    const draft = screen.getByRole('button', { name: /Vue/ })
    expect(draft).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(draft)
    expect(onChange).toHaveBeenCalledWith({ selectedIds: [], draftNames: [] })
  })
})
