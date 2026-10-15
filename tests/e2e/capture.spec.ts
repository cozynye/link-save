import { expect, test } from '@playwright/test'
import { emptyVault, installGithubMock, seedSettings } from './github-mock'

test('링크를 붙여 넣고 저장하면 목록과 GitHub에 반영된다', async ({ page }) => {
  await seedSettings(page)
  const gh = await installGithubMock(page, { initial: emptyVault() })
  await page.goto('/')
  await page.getByLabel('링크 붙여 넣기').fill('https://example.com/post?utm_source=x')
  await page.getByLabel('링크 붙여 넣기').press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('제목')).toHaveValue('OG 제목')
  await dialog.getByLabel('노트').fill('나중에 읽기')
  await dialog.getByLabel('새 태그').fill('읽을거리')
  await dialog.getByLabel('새 태그').press('Enter')
  await dialog.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText('OG 제목')).toBeVisible()
  await expect.poll(() => gh.puts.at(-1)?.message).toBe('Add link: OG 제목')
  const saved = gh.vault!.links[0]
  expect(saved.url).toBe('https://example.com/post')
  expect(saved.note).toBe('나중에 읽기')
  expect(gh.vault!.tags.map((t) => t.name)).toEqual(['읽을거리'])
  expect(saved.tags).toEqual([gh.vault!.tags[0].id])
})
