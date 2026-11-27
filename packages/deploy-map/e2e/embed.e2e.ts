import { expect, test, type Page } from '@playwright/test'

const BOOTSTRAP_BLUE = 'rgb(13, 110, 253)'
const INJECTED_STYLES = 'style[data-deploy-map-bootstrap]'

test.beforeEach(async ({ page }) => {
  // Keep the tests offline: no map tiles, and the CDN Bootstrap of the demo
  // page is served from node_modules.
  await page.route('**/server.arcgisonline.com/**', (route) => route.abort())
  await page.route('**/tile.openstreetmap.org/**', (route) => route.abort())
  await page.route('**/cdn.jsdelivr.net/**/bootstrap.min.css', (route) =>
    route.fulfill({
      path: '../../node_modules/bootstrap/dist/css/bootstrap.min.css', // workspace root
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

    await popover.getByLabel('BirdScan radar').uncheck()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Table', exact: true }).click()
    // 19 deployments in the test data, 3 of them BirdScan.
    await expect(page.locator('.deploy-map tbody tr')).toHaveCount(16)
  })
}

/**
 * The tutorial runs its examples from the code it displays. Every example must
 * therefore produce a working widget: a typo in a code block, or an option the
 * widget no longer accepts, would otherwise show readers a broken tutorial.
 */
test('tutorial: every example renders a widget without errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/demo/tutorial.html')
  const examples = await page.locator('pre.runnable').count()
  expect(examples).toBeGreaterThan(5)
  await expect(page.locator('.result .deploy-map canvas')).toHaveCount(examples)
  await expect(page.locator('.deploy-map [role=alert]')).toHaveCount(0)
  expect(errors).toEqual([])
})

/**
 * Several widgets on one page must not share element ids. Each widget is its
 * own Vue app, and their generated ids used to be identical, so the filter
 * button of a later widget opened the popover of the first one. The last
 * tutorial example has the same filters as earlier ones: its button must open
 * its own popover, right under it.
 */
test('tutorial: a filter in a later widget opens its own popover', async ({ page }) => {
  await page.goto('/demo/tutorial.html')
  const widget = page.locator('#full-map')
  await expect(widget.locator('canvas')).toBeVisible()
  const button = widget.getByRole('button', { name: 'Radar type' })
  await button.click()
  const popover = widget.locator('[popover]:popover-open')
  await expect(popover).toBeVisible()
  const buttonBox = (await button.boundingBox())!
  const popoverBox = (await popover.boundingBox())!
  expect(Math.abs(popoverBox.x - buttonBox.x)).toBeLessThan(2)
  expect(Math.abs(popoverBox.y - (buttonBox.y + buttonBox.height))).toBeLessThan(12)
  expect(await page.locator('[id]').evaluateAll((els) => els.length - new Set(els.map((el) => el.id)).size)).toBe(0)
})

/**
 * A map embedded in a page must not swallow the scroll wheel: someone scrolling
 * down the page with the pointer passing over the map expects the page to keep
 * moving, not the map to zoom. Only after a click on the map (a sign they mean
 * to use it) does the wheel zoom, and that ends when the pointer leaves.
 */
test('the scroll wheel scrolls the page until the map is clicked', async ({ page }) => {
  await page.goto('/demo/tutorial.html')
  const map = page.locator('#first-map .leaflet-container')
  await map.scrollIntoViewIfNeeded()
  await expect(map.locator('canvas')).toBeVisible()
  // Leaflet keeps the current zoom in this element's transform.
  const zoomState = () => map.locator('.leaflet-proxy').getAttribute('style')

  const box = (await map.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  const [zoomBefore, scrollBefore] = [await zoomState(), await page.evaluate(() => scrollY)]
  await page.mouse.wheel(0, 200)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore)
  expect(await zoomState()).toBe(zoomBefore)

  // The page has moved under the pointer, and may still be gliding: wait for
  // it to stop, then go back onto the map and click it.
  await settleScroll(page)
  const moved = (await map.boundingBox())!
  await page.mouse.click(moved.x + moved.width / 2, moved.y + moved.height / 2)
  const zoomClicked = await zoomState()
  // Keep turning the wheel, as a person does. A single wheel event sent within
  // milliseconds of the click can be missed in WebKit, which learns about the
  // newly added wheel listener a moment later.
  await expect(async () => {
    await page.mouse.wheel(0, 100)
    expect(await zoomState()).not.toBe(zoomClicked)
  }).toPass()

  await page.mouse.move(2, 2) // leave the map
  const [zoomLeft, scrollLeft] = [await zoomState(), await page.evaluate(() => scrollY)]
  await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2)
  await page.mouse.wheel(0, 200)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollLeft)
  expect(await zoomState()).toBe(zoomLeft)
})

/** Resolve once the page has stopped scrolling (two equal positions 100 ms apart). */
async function settleScroll(page: Page) {
  let previous = -1
  await expect
    .poll(async () => {
      const current = await page.evaluate(() => scrollY)
      const settled = current === previous
      previous = current
      return settled
    }, { intervals: [100] })
    .toBe(true)
}

/**
 * Client coordinates of a marker. Markers are drawn on a canvas and tiles are
 * blocked in these tests, so any opaque canvas pixel belongs to a marker's
 * outline. Pixels covered by something else (zoom buttons, legend) are skipped.
 */
async function findMarker(page: Page): Promise<{ x: number; y: number }> {
  // The canvas exists before Leaflet has painted the markers on it (it draws
  // on the next animation frame), so keep looking until one shows up.
  let point: { x: number; y: number } | null = null
  await expect(async () => {
    point = await scanForMarker(page)
    expect(point, 'a marker on the canvas').not.toBeNull()
  }).toPass()
  return point!
}

function scanForMarker(page: Page): Promise<{ x: number; y: number } | null> {
  return page.locator('.deploy-map canvas').evaluate((canvas: HTMLCanvasElement) => {
    const { data, width, height } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    const box = canvas.getBoundingClientRect()
    // The canvas takes no pointer events itself: Leaflet hit-tests on the map element.
    const mapEl = canvas.closest('.leaflet-container')
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) continue
      const pixel = (i - 3) / 4
      const x = box.left + ((pixel % width) + 0.5) * (box.width / width)
      const y = box.top + (Math.floor(pixel / width) + 0.5) * (box.height / height)
      // The scan meets a marker at the top edge of its 3px outline; aim at the
      // middle of the outline, the edge itself is a rounding error from a miss.
      if (document.elementFromPoint(x, y) === mapEl) return { x, y: y + 1.5 }
    }
    return null
  })
}

/**
 * Clicking a marker is the main way into a point's details: it must open the
 * panel with that point's properties and tell the host through `onSelect`.
 * Escape closes it again. Guards the canvas click handling of the Leaflet beta.
 */
test('clicking a marker opens its panel, Escape closes it', async ({ page }) => {
  const logged: string[] = []
  page.on('console', (message) => logged.push(message.text()))
  await openDemo(page, '/demo/index.html')
  const marker = await findMarker(page)
  await page.mouse.click(marker.x, marker.y)

  const panel = page.getByRole('complementary')
  await expect(panel.getByRole('rowheader', { name: 'Deployment id' })).toBeVisible()
  await expect.poll(() => logged.some((line) => line.startsWith('select'))).toBe(true)

  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
})

/**
 * The table is the keyboard-accessible alternative to the map: a row can be
 * opened without a mouse, the panel shows that row's point, the row is marked,
 * and closing the panel puts focus back on the row so the user keeps their place.
 */
test('a table row opens its panel from the keyboard and gets focus back', async ({ page }) => {
  await openDemo(page, '/demo/index.html')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  const rowButton = page.getByRole('button', { name: 'nldhl', exact: true })
  await rowButton.focus()
  await page.keyboard.press('Enter')

  const panel = page.getByRole('complementary', { name: 'Den Helder' })
  await expect(panel.getByRole('cell', { name: 'nldhl-1' })).toBeVisible()
  await expect(page.locator('tr.table-active')).toContainText('nldhl')
  await expect(panel.getByRole('button', { name: 'Close' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(rowButton).toBeFocused()
})

/**
 * On a narrow widget (a phone, or a narrow column) there is no room for a
 * panel beside the map, so it must cover the map area instead of squeezing it.
 */
test('on a narrow widget the panel covers the map', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 })
  await openDemo(page, '/demo/index.html')
  const marker = await findMarker(page)
  await page.mouse.click(marker.x, marker.y)
  const panel = await page.getByRole('complementary').boundingBox()
  const body = await page.locator('.deploy-map__body').boundingBox()
  expect(panel).toEqual(body)
})

/**
 * `panel.sections` and `valueLabels` are what lets a host (the radar registry)
 * get its metadata blocks from configuration alone: the panel must show the
 * configured title, section headings and labels, and the value label must
 * replace the raw value in the panel, the legend and the table alike.
 */
test('the panel follows the configured sections and value labels', async ({ page }) => {
  await openDemo(page, '/demo/index.html')
  await expect(page.getByLabel('Legend')).toContainText('Weather radar')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await page.getByRole('button', { name: 'nldhl', exact: true }).click()

  const panel = page.getByRole('complementary', { name: 'Den Helder' })
  await expect(panel.getByRole('heading', { name: 'Radar metadata' })).toBeVisible()
  await expect(panel.getByRole('heading', { name: 'Deployment metadata' })).toBeVisible()
  await expect(panel.getByRole('row', { name: 'Max range (km) 320' })).toBeVisible()
  await expect(panel.getByRole('row', { name: 'Type Weather radar' })).toBeVisible()
  await expect(page.locator('tr.table-active')).toContainText('Weather radar')
})

/**
 * With no `panel` option the widget must still show something useful (every
 * plain property), and `panel.content` must replace that list with the host's
 * own element, rebuilt for each selected point.
 */
test('the panel lists all properties by default and accepts custom content', async ({ page }) => {
  await openDemo(page, '/demo/index.html')
  await page.evaluate(() => {
    const mount = (window as unknown as { DeployMap: { mount: (el: Element, config: object) => void } })
      .DeployMap.mount
    for (const id of ['plain', 'custom']) {
      document.body.insertAdjacentHTML('beforeend', `<div id="${id}" style="height: 400px"></div>`)
    }
    mount(document.querySelector('#plain')!, { data: 'registry.json' })
    mount(document.querySelector('#custom')!, {
      data: 'registry.json',
      panel: {
        content: (feature: { properties: { radar_id: string } }) => {
          const p = document.createElement('p')
          p.textContent = `Custom content for ${feature.properties.radar_id}`
          return p
        },
      },
    })
  })
  for (const id of ['plain', 'custom']) {
    await page.locator(`#${id}`).getByRole('button', { name: 'Table', exact: true }).click()
  }
  await page.locator('#plain').getByRole('button', { name: 'nldhl-1', exact: true }).click()
  const plain = page.locator('#plain').getByRole('complementary', { name: 'Details' })
  await expect(plain.getByRole('row', { name: 'Antenna height 55' })).toBeVisible()

  const custom = page.locator('#custom')
  await custom.getByRole('button', { name: 'nldhl-1', exact: true }).click()
  await expect(custom.getByRole('complementary')).toContainText('Custom content for nldhl')
  await custom.getByRole('button', { name: 'behel-1', exact: true }).click()
  await expect(custom.getByRole('complementary')).toContainText('Custom content for behel')
})

/**
 * The reason permalinks exist: a link to a specific radar must open the
 * widget with that radar's panel. A later change of the address (an edited
 * URL, or a link to the same page) must be followed too.
 */
test('a link to a point opens the widget with its panel', async ({ page }) => {
  await openDemo(page, '/demo/index.html#point=nldhl-1')
  await expect(page.getByRole('complementary', { name: 'Den Helder' })).toBeVisible()

  await page.evaluate(() => (location.hash = 'point=behel-1'))
  await expect(page.getByRole('complementary', { name: 'Helchteren' })).toBeVisible()
})

/**
 * What the user sets up must survive a reload through the address alone:
 * selection, table view and a narrowed filter. Closing the panel and undoing
 * the rest must leave a clean address, so the widget does not litter the URL.
 */
test('the address follows selection, view and filters, and restores them', async ({ page }) => {
  await openDemo(page, '/demo/index.html')
  await page.getByRole('button', { name: 'Radar type' }).click()
  await page.getByLabel('BirdScan radar').uncheck()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await page.getByRole('button', { name: 'nldhl', exact: true }).click()
  await expect(page).toHaveURL(/#point=nldhl-1&view=table&f\.type=weather$/)

  await page.reload()
  const panel = page.getByRole('complementary', { name: 'Den Helder' })
  await expect(panel).toBeVisible()
  await expect(page.locator('tr.table-active')).toContainText('nldhl')
  await expect(page.getByRole('button', { name: 'Radar type' })).toContainText('1/2')

  await panel.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Map', exact: true }).click()
  await page.getByRole('button', { name: 'Radar type' }).click()
  await page.getByLabel('BirdScan radar').check()
  await expect(page).toHaveURL(/index\.html$/)
})

/**
 * The panel's headings must look the same whether Bootstrap comes from the
 * host or from the widget. The bundled copy styles headings as
 * `.deploy-map h2`, which once outweighed the panel's own sizes and gave a
 * page-title-sized heading on hosts without Bootstrap.
 */
for (const path of ['/demo/index.html', '/demo/bare.html']) {
  test(`${path}: the panel title keeps its own size`, async ({ page }) => {
    await openDemo(page, path)
    await page.getByRole('button', { name: 'Table', exact: true }).click()
    await page.getByRole('button', { name: 'nldhl', exact: true }).click()
    const panel = page.getByRole('complementary')
    await expect(panel.getByRole('heading', { name: 'Den Helder' })).toHaveCSS('font-size', '16px')
    await expect(panel.getByRole('heading', { name: 'Radar metadata' })).toHaveCSS('font-size', '14px')
  })
}

/**
 * The part of the address after "#" belongs to the host page. Following one of
 * the page's own anchor links used to be read as "no state": the panel closed,
 * the filters were cleared and the anchor was wiped from the address. The
 * widget must now ignore such a fragment and leave it in place.
 */
test('a host anchor link leaves the widget and the address alone', async ({ page }) => {
  await openDemo(page, '/demo/index.html#point=nldhl-1')
  const panel = page.getByRole('complementary', { name: 'Den Helder' })
  await expect(panel).toBeVisible()

  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<a id="to-contact" href="#contact">Contact</a><p id="contact">x</p>')
  })
  await page.locator('#to-contact').click()
  await expect(page).toHaveURL(/#contact$/)
  await expect(panel).toBeVisible()
  // Give a wrong reaction to the hashchange event time to show.
  await page.waitForTimeout(300)
  await expect(page).toHaveURL(/#contact$/)
  await expect(panel).toBeVisible()
})

/**
 * A panel opened by a link, at page load or later, must not pull keyboard
 * focus into the widget: the host page may have its own focused field. The
 * host is told about the selection, so it does not go out of step.
 */
test('a link opens the panel without taking focus, and tells the host', async ({ page }) => {
  const logged: string[] = []
  page.on('console', (message) => logged.push(message.text()))
  await openDemo(page, '/demo/index.html#point=nldhl-1')
  await expect(page.getByRole('complementary', { name: 'Den Helder' })).toBeVisible()
  await expect(page.locator('body')).toBeFocused()
  await expect.poll(() => logged).toContain('select nldhl-1')

  await page.evaluate(() => (location.hash = 'point=behel-1'))
  await expect(page.getByRole('complementary', { name: 'Helchteren' })).toBeVisible()
  await expect(page.locator('body')).toBeFocused()
  await expect.poll(() => logged).toContain('select behel-1')
})

/**
 * A table row must stay the same element for the same point when rows above
 * it are filtered away. Rows used to be reused by position, so the element a
 * keyboard user was on silently became another point. The selected row is
 * also announced as current, not only tinted.
 */
test('table rows keep their identity through filtering and expose the selected one', async ({ page }) => {
  await openDemo(page, '/demo/index.html')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await page.getByRole('button', { name: 'nldhl', exact: true }).click()
  const current = page.locator('tr[aria-current=true]')
  await expect(current).toContainText('nldhl')
  const row = await current.elementHandle()

  await page.getByRole('button', { name: 'Country' }).click()
  await page.getByLabel('Belgium').uncheck()
  await expect(page.getByRole('button', { name: 'behel', exact: true })).toHaveCount(0)
  expect(await row!.evaluate((el) => el.isConnected && el.textContent!.includes('nldhl'))).toBe(true)
})

/** Whether some marker on the canvas is drawn in the colour `rgb` ("r,g,b"). */
function hasMarkerColour(page: Page, rgb: string): Promise<boolean> {
  return page.locator('.deploy-map canvas').evaluate((canvas: HTMLCanvasElement, wanted) => {
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 255 && `${data[i]},${data[i + 1]},${data[i + 2]}` === wanted) return true
    }
    return false
  }, rgb)
}

/**
 * `update()` must change the running widget, not only part of it. Changing
 * `style` used to update the legend while the markers kept their old colours,
 * and a new `filters` list kept the selection of the old one.
 */
test('update() recolours the markers and replaces the filters', async ({ page }) => {
  await openDemo(page, '/demo/index.html')
  await findMarker(page) // the markers are painted
  // Third colour of the default palette: unused with two radar types,
  // used once the markers are coloured by country (four countries).
  const GREEN = '0,158,115'
  expect(await hasMarkerColour(page, GREEN)).toBe(false)
  await page.getByRole('button', { name: 'Radar type' }).click()
  await page.getByLabel('BirdScan radar').uncheck()
  await page.keyboard.press('Escape')

  // `widget` is the handle the demo page keeps.
  await page.evaluate("widget.update({ style: { colourBy: 'country' }, filters: ['location'] })")
  await expect(page.getByLabel('Legend')).toContainText('Belgium')
  await expect.poll(() => hasMarkerColour(page, GREEN)).toBe(true)
  await expect(page.getByRole('button', { name: 'Radar type' })).toHaveCount(0)
  // The old filter no longer hides anything, and the new one starts unrestricted.
  await expect(page.getByRole('button', { name: 'Location' })).not.toContainText('/')
  await page.getByRole('button', { name: 'Table', exact: true }).click()
  await expect(page.getByRole('button', { name: 'bs290', exact: true })).toBeVisible()
})

/**
 * A misspelt option is silently ignored by JavaScript, and "colorBy" for
 * "colourBy" is the spelling most people will type first. The widget must say
 * so in the console, for options at mount and in update(), instead of showing
 * one colour for all points with no hint why.
 */
test('an unknown option name is reported in the console', async ({ page }) => {
  const warnings: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  await openDemo(page, '/demo/index.html')
  expect(warnings.filter((text) => text.includes('unknown'))).toEqual([])

  await page.evaluate("widget.update({ style: { colorBy: 'country' }, onFilterchange: () => {} })")
  await expect.poll(() => warnings.join('\n')).toContain('unknown style option "colorBy"')
  expect(warnings.join('\n')).toContain('unknown option "onFilterchange"')
})
