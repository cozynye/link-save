import { expect, test } from '@playwright/test'
import { installGithubMock } from './github-mock'

test('온보딩에서 토큰을 넣고 연결하면 초기 파일을 만든다', async ({ page }) => {
  const gh = await installGithubMock(page, { initial: null })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'SaveLink' })).toBeVisible()
  await page.getByLabel('GitHub 사용자명').fill('me')
  await page.getByLabel('토큰').fill('github_pat_e2e')
  await page.getByRole('button', { name: '연결' }).click()
  await expect(page.getByLabel('링크 붙여 넣기')).toBeVisible()
  expect(gh.puts[0]?.message).toBe('Initialize vault')
  const saved = await page.evaluate(() => localStorage.getItem('savelink.settings'))
  expect(JSON.parse(saved ?? '{}')).toMatchObject({ owner: 'me', repo: 'save-link-data', token: 'github_pat_e2e' })
})
