import { describe, expect, it } from 'vitest'
import { TAG_COLORS } from '@/vault/schema'
import { TAG_CHIP_CLASS, TAG_COLOR_LABEL, TAG_DOT_CLASS } from './palette'

describe('palette', () => {
  it('열두 색 모두에 칩, 점, 라벨이 있다', () => {
    for (const color of TAG_COLORS) {
      expect(TAG_CHIP_CLASS[color]).toMatch(/dark:/)
      expect(TAG_DOT_CLASS[color]).toMatch(/^bg-/)
      expect(TAG_COLOR_LABEL[color].length).toBeGreaterThan(0)
    }
  })
})
