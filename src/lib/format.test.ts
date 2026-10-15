import { describe, expect, it } from 'vitest'
import { formatBytes, formatDate } from './format'

describe('formatDate', () => {
  const now = new Date('2026-10-14T12:00:00Z')
  it('같은 해는 월일만', () => {
    expect(formatDate('2026-03-02T12:00:00.000Z', now)).toBe('3월 2일')
  })
  it('다른 해는 연도 포함', () => {
    expect(formatDate('2025-03-02T12:00:00.000Z', now)).toBe('2025년 3월 2일')
  })
})

describe('formatBytes', () => {
  it('단위를 붙인다', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(1_500_000)).toBe('1.4 MB')
  })
})
