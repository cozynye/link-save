import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetUiStoreForTests, useUiStore } from '@/lib/uiStore'
import { UrlInput } from './UrlInput'

beforeEach(() => resetUiStoreForTests())

describe('UrlInput', () => {
  it('Enter로 제출하면 정규화된 URL로 캡처를 열고 입력을 비운다', async () => {
    render(<UrlInput />)
    const input = screen.getByLabelText('링크 붙여 넣기')
    await userEvent.type(input, ' Example.com/a/?utm_source=x {enter}')
    expect(useUiStore.getState().captureUrl).toBe('https://example.com/a')
    expect(input).toHaveValue('')
  })
  it('URL을 붙여 넣으면 즉시 캡처를 연다', () => {
    render(<UrlInput />)
    const input = screen.getByLabelText('링크 붙여 넣기')
    fireEvent.paste(input, { clipboardData: { getData: () => 'https://blog.dev/post#top' } })
    expect(useUiStore.getState().captureUrl).toBe('https://blog.dev/post')
  })
  it('URL이 아니면 오류를 보여주고 캡처를 열지 않는다', async () => {
    render(<UrlInput />)
    await userEvent.type(screen.getByLabelText('링크 붙여 넣기'), '오늘 할 일{enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('올바른 주소가 아니에요')
    expect(useUiStore.getState().captureUrl).toBeNull()
  })
})
