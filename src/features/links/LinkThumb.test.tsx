import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LinkThumb, faviconUrl } from './LinkThumb'

describe('LinkThumb', () => {
  it('이미지 → 파비콘 → 첫 글자 순으로 폴백한다', () => {
    const { container } = render(<LinkThumb image="https://e.com/og.png" url="https://www.example.com/a" title="제목" variant="row" />)
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('src', 'https://e.com/og.png')
    fireEvent.error(img)
    const favicon = container.querySelector('img')!
    expect(favicon.getAttribute('src')).toBe(faviconUrl('https://www.example.com/a'))
    expect(favicon.getAttribute('src')).toContain('domain=example.com')
    fireEvent.error(favicon)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('제')).toBeInTheDocument()
  })
  it('이미지가 없으면 파비콘부터 시작한다', () => {
    const { container } = render(<LinkThumb image={null} url="https://blog.dev/x" title="Hello" variant="card" />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('domain=blog.dev')
  })
})
