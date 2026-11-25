import { expect, test, type Page } from '@playwright/test'

const BOOTSTRAP_BLUE = 'rgb(13, 110, 253)'
const INJECTED_STYLES = 'style[data-deploy-map-bootstrap]'

test.beforeEach(async ({ page }) => {
  // Keep the tests offline: no map tiles, and the CDN Bootstrap of the demo
  // page is served from node_modules.
  await page.route('**/server.arcgisonline.com/**', (route) => route.abort())
  await page.route('**/cdn.jsdelivr.net/**/bootstrap.min.css', (route) =>
    route.fulfill({
      path: 'node_modules/bootstrap/dist/css/bootstrap.min.css',
      contentType: 'text/css',
    }),
  )
})

/** Open a demo page and wait until the widget has drawn its markers. */
async function openDemo(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('.deploy-map canvas')).toBeVisible()
}

/**
 * On a host without Bootstrap the widget must look right on its own: it injects
 * its bundled styles once, and its buttons get Bootstrap's look.
 */
test('bare page: the widget brings its own Bootstrap styles', async ({ page }) => {
  await openDemo(page, '/demo/bare.html')
  await expect(page.locator(INJECTED_STYLES)).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Map', exact: true })).toHaveCSS(
    'background-color',
    BOOTSTRAP_BLUE,
  )
})

/**
 * The bundled styles must not reach the host page. An element outside the
 * widget that happens to use Bootstrap class names stays unstyled, and the
 * host keeps its own body font. This is the reason the styles are scoped.
 */
test('bare page: the bundled styles do not leak into the host', async ({ page }) => {
  await openDemo(page, '/demo/bare.html')
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<button id="outside" class="btn btn-primary">x</button>')
  })
  await expect(page.locator('#outside')).not.toHaveCSS('background-color', BOOTSTRAP_BLUE)
  await expect(page.locator('body')).toHaveCSS('font-family', /Georgia/)
})

/**
 * On a host that already has Bootstrap 5.3 (the Aloft site), `bootstrap: 'auto'`
 * must detect it and inject nothing, so the widget follows the host's theme
 * instead of shipping a second copy.
 */
test('Bootstrap page: the widget uses the host styles and injects none', async ({ page }) => {
  await openDemo(page, '/demo/index.html')
  await expect(page.locator(INJECTED_STYLES)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Map', exact: true })).toHaveCSS(
    'background-color',
    BOOTSTRAP_BLUE,
  )
})

for (const path of ['/demo/bare.html', '/demo/index.html']) {
  /**
   * End-to-end check of the filter in each style mode and each browser engine.
   * The popover relies on the Popover API and CSS anchor positioning, which
   * engines implement separately: it must open directly under its button, not
   * elsewhere on the page. Unticking an option must then narrow the table.
   */
  test(`${path}: a filter opens under its button and narrows the table`, async ({ page }) => {
    await openDemo(page, path)
    const button = page.getByRole('button', { name: 'Radar type' })
    await button.click()
    const popover = page.locator('[popover]:popover-open')
    await expect(popover).toBeVisible()

    const buttonBox = (await button.boundingBox())!
    const popoverBox = (await popover.boundingBox())!
    expect(Math.abs(popoverBox.x - buttonBox.x)).toBeLessThan(2)
    expect(popoverBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height - 1)
    expect(popoverBox.y).toBeLessThan(buttonBox.y + buttonBox.height + 12)

    await popover.getByLabel('birdscan').uncheck()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Table', exact: true }).click()
    // 19 deployments in the test data, 3 of them BirdScan.
    await expect(page.locator('.deploy-map tbody tr')).toHaveCount(16)
  })
}
