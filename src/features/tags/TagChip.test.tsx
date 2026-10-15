import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TagChip } from './TagChip'

const tag = { id: 't1', name: 'React', color: 'cyan' as const }

describe('TagChip', () => {
  it('onClick이 없으면 span, 있으면 aria-pressed 버튼', async () => {
    const { rerender } = render(<TagChip tag={tag} count={3} />)
    expect(screen.getByText('React').closest('button')).toBeNull()
    expect(screen.getByText('3')).toBeInTheDocument()
    const onClick = vi.fn()
    rerender(<TagChip tag={tag} selected onClick={onClick} />)
    const button = screen.getByRole('button', { name: /React/ })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
