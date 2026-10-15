import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { QuickSavePanel } from './QuickSavePanel'

describe('QuickSavePanel', () => {
  it('북마클릿 링크의 href는 javascript: 코드이고 iPhone 단축어 안내가 있다', () => {
    render(<QuickSavePanel />)
    const link = screen.getByRole('link', { name: /SaveLink에 저장/ })
    expect(link.getAttribute('href')).toMatch(/^javascript:void\(window\.open\('http:\/\/localhost:3000\/\?url='/)
    expect(screen.getByText(/공유 시트에서 URL 받기/)).toBeInTheDocument()
    expect(screen.getByText(/localhost:3000\/\?url=/)).toBeInTheDocument()
  })
})
