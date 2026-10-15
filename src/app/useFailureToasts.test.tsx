import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { resetVaultStoreForTests, useVaultStore } from '@/vault/store'
import { useFailureToasts } from './useFailureToasts'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

beforeEach(() => {
  resetVaultStoreForTests()
  vi.mocked(toast.error).mockClear()
})

describe('useFailureToasts', () => {
  it('lastFailure가 바뀔 때마다 toast.error를 부른다', () => {
    renderHook(() => useFailureToasts())
    expect(toast.error).not.toHaveBeenCalled()
    act(() => useVaultStore.setState({ lastFailure: { message: '링크 저장에 실패했어요: 500', at: 1 } }))
    expect(toast.error).toHaveBeenCalledWith('링크 저장에 실패했어요: 500')
    act(() => useVaultStore.setState({ lastFailure: { message: '링크 저장에 실패했어요: 500', at: 2 } }))
    expect(toast.error).toHaveBeenCalledTimes(2)
  })
})
