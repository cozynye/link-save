import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LinkThumb, monogramOf } from './LinkThumb'

describe('LinkThumb', () => {
  it('행: 이미지가 실패하면 도메인 첫 글자 사각형으로 바뀌고, 외부 파비콘을 부르지 않는다', () => {
    const { container } = render(<LinkThumb image="https://e.com/og.png" url="https://www.example.com/a" title="제목" variant="row" />)
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('src', 'https://e.com/og.png')
    fireEvent.error(img)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('E')).toBeInTheDocument()
  })
  it('행: 이미지가 없으면 바로 첫 글자 사각형', () => {
    const { container } = render(<LinkThumb image={null} url="https://blog.dev/x" title="Hello" variant="row" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('B')).toBeInTheDocument()
  })
  it('카드: 이미지가 없거나 실패하면 아무것도 그리지 않는다', () => {
    const { container, rerender } = render(<LinkThumb image={null} url="https://blog.dev/x" title="Hello" variant="card" />)
    expect(container).toBeEmptyDOMElement()
    rerender(<LinkThumb image="https://e.com/a.png" url="https://blog.dev/x" title="Hello" variant="card" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container).toBeEmptyDOMElement()
  })
  it('이미지 주소가 바뀌면 실패 기록을 지운다', () => {
    const { container, rerender } = render(<LinkThumb image="https://e.com/a.png" url="https://e.com" title="t" variant="card" />)
    fireEvent.error(container.querySelector('img')!)
    rerender(<LinkThumb image="https://e.com/b.png" url="https://e.com" title="t" variant="card" />)
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://e.com/b.png')
  })
  it('monogramOf는 www.를 뗀 도메인 첫 글자, 실패하면 제목 첫 글자', () => {
    expect(monogramOf('https://www.github.com/x', '제목')).toBe('G')
    expect(monogramOf('not a url', '한글 제목')).toBe('한')
    expect(monogramOf('https://example.com/x', '제목', ' medium.com')).toBe('M')
  })
})
