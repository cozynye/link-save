import { describe, expect, it } from 'vitest'
import { bookmarkletCode } from './bookmarklet'

describe('bookmarkletCode', () => {
  it('origin을 넣은 javascript: URL을 만든다', () => {
    const code = bookmarkletCode('https://save.example')
    expect(code.startsWith('javascript:')).toBe(true)
    expect(code).toContain("'https://save.example/?url='+encodeURIComponent(location.href)")
    expect(code).toContain("'_blank'")
  })
})
