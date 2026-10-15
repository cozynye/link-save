import { expect, test } from '@playwright/test'
import { emptyVault, installGithubMock, seedSettings } from './github-mock'

test('?url= 딥링크는 캡처 시트를 열고 주소에서 사라진다', async ({ page }) => {
  await seedSettings(page)
  await installGithubMock(page, { initial: emptyVault() })
  await page.goto(`/?url=${encodeURIComponent('https://example.com/p?a=1&b=2')}`)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('https://example.com/p?a=1&b=2')).toBeVisible()
  expect(new URL(page.url()).search).toBe('')
})
