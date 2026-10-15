import { expect, test } from '@playwright/test'
import { installGithubMock, link, seedSettings } from './github-mock'

test('상세 시트에서 노트를 고치면 updateLink 커밋이 생긴다', async ({ page }) => {
  await seedSettings(page)
  const gh = await installGithubMock(page, { initial: { version: 1, tags: [], links: [link('1', { title: '고칠 글', note: '전' })] } })
  await page.goto('/')
  await page.getByRole('button', { name: '고칠 글 상세' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('노트').fill('후')
  await dialog.getByRole('button', { name: '저장' }).click()
  await expect(dialog).toBeHidden()
  await expect.poll(() => gh.puts.at(-1)?.message).toBe('Update link: 고칠 글')
  expect(gh.vault!.links[0].note).toBe('후')
  expect(gh.vault!.links[0].title).toBe('고칠 글')
})
