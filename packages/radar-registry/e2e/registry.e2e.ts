import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Keep the tests offline: no map tiles.
  await page.route('**/server.arcgisonline.com/**', (route) => route.abort())
})

/**
 * The goal of this stage of the registry: a link to a specific radar opens
 * the map with that radar's panel. It must work from `data` alone, so this
 * also guards the presets (panel blocks with units, value labels, legend,
 * permalinks on deployment ids) and that the single script tag brings
 * everything the widget needs.
 */
test('a link to a radar opens the registry with its panel', async ({ page }) => {
  await page.goto('/demo/index.html#point=nldhl-1')
  await expect(page.locator('.deploy-map canvas')).toBeVisible()
  await expect(page.getByLabel('Legend')).toContainText('Weather radar')

  const panel = page.getByRole('complementary', { name: 'Den Helder' })
  await expect(panel.getByRole('heading', { name: 'Radar metadata' })).toBeVisible()
  await expect(panel.getByRole('row', { name: 'Max range (km) 320' })).toBeVisible()
  await expect(panel.getByRole('row', { name: 'Other codes 6234, 1207' })).toBeVisible()
  await expect(panel.getByRole('heading', { name: 'Deployment metadata' })).toBeVisible()
  await expect(panel.getByRole('row', { name: 'Antenna height (m) 55' })).toBeVisible()
})

/**
 * The other direction of the same feature: the address must follow what the
 * user selects, so that the link they copy leads back to that radar.
 */
test('selecting a radar in the table updates the address', async ({ page }) => {
  await page.goto('/demo/index.html')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await page.getByRole('button', { name: 'behel', exact: true }).click()
  await expect(page).toHaveURL(/#point=behel-1&view=table$/)
  await expect(page.getByRole('complementary', { name: 'Helchteren' })).toBeVisible()
})
