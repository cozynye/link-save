import { expect, test } from '@playwright/test'
import { installGithubMock, link, seedSettings } from './github-mock'

test('태그 필터와 검색이 목록을 좁힌다', async ({ page }) => {
  await seedSettings(page)
  await installGithubMock(page, {
    initial: {
      version: 1,
      tags: [{ id: 'ai0000', name: 'AI', color: 'violet' }, { id: 'css000', name: 'CSS', color: 'pink' }],
      links: [
        link('1', { title: 'React Query 가이드', tags: ['ai0000'] }),
        link('2', { title: 'CSS Grid 완전 정복', tags: ['css000'] }),
        link('3', { title: '기타 메모', note: '그리드 레이아웃', tags: ['ai0000', 'css000'] }),
      ],
    },
  })
  await page.goto('/')
  await expect(page.getByText('React Query 가이드')).toBeVisible()
  await page.getByRole('button', { name: /CSS/ }).first().click()
  await expect(page.getByText('React Query 가이드')).toBeHidden()
  await expect(page.getByText('CSS Grid 완전 정복')).toBeVisible()
  await expect(page.getByText('기타 메모')).toBeVisible()
  await page.getByLabel('검색').fill('그리드')
  await expect(page.getByText('CSS Grid 완전 정복')).toBeHidden()
  await expect(page.getByText('기타 메모')).toBeVisible()
  await page.getByLabel('검색어 지우기').click()
  await expect(page.getByText('CSS Grid 완전 정복')).toBeVisible()
})
