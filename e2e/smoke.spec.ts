import { test, expect } from '@playwright/test'

test('loads Ascendancy of Iron Suns shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Ascendancy of Iron Suns/i)
  const bar = page.locator('.resource-bar')
  await expect(bar).toBeVisible({ timeout: 15_000 })
  await expect(bar.locator('.empire-mandate')).toContainText('Throne Mandate')
  await expect(bar.locator('.empire-name')).toHaveText('Solar Ascendancy')
})
