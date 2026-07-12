import { chromium } from 'playwright-core'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const failures = []
page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`))
page.on('console', (message) => { if (message.type() === 'error') failures.push(`console: ${message.text()}`) })

await page.goto(`${baseUrl}/?view=gallery`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.locator('canvas').waitFor({ state: 'visible', timeout: 60000 })
await page.getByRole('button', { name: /bắt đầu tham quan/i }).click()
await page.waitForTimeout(6000)

const hintVisible = await page.locator('.interaction-hint').isVisible()
if (!hintVisible) failures.push('poster interaction hint was not visible')
await page.keyboard.press('e')
await page.locator('.content-panel').waitFor({ state: 'visible', timeout: 5000 })
await page.waitForTimeout(1500)

const panelState = await page.locator('.content-panel').evaluate((element) => {
  const style = getComputedStyle(element)
  const rect = element.getBoundingClientRect()
  return { opacity: style.opacity, display: style.display, visibility: style.visibility, background: style.backgroundColor, width: rect.width, height: rect.height, x: rect.x, y: rect.y }
})
if (Number(panelState.opacity) < .95 || panelState.width < 500 || panelState.height < 400) failures.push(`poster panel is not visibly rendered: ${JSON.stringify(panelState)}`)
console.log(JSON.stringify({ hintVisible, panelState }))
await page.screenshot({ path: '_artifacts/smoke-panel.png', fullPage: true })

await page.keyboard.press('Escape')
await page.waitForTimeout(200)
if (await page.locator('.content-panel').count()) failures.push('poster panel did not close with Escape')

async function waitForArea(area, timeout = 20000) {
  try {
    await page.waitForFunction((expected) => document.querySelector('.minimap')?.getAttribute('data-current-area') === expected, area, { timeout })
  } catch {
    // SwiftShader can produce fewer than one rendered frame per second in this scene.
  }
  return await page.locator('.minimap').getAttribute('data-current-area') === area
}

// Verify the outdoor/indoor threshold is traversable with ordinary movement.
await page.goto(`${baseUrl}/?view=entrance`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.locator('canvas').waitFor({ state: 'visible', timeout: 60000 })
await page.getByRole('button', { name: /bắt đầu tham quan/i }).click()
await page.waitForTimeout(3000)
await page.keyboard.down('w')
if (!await waitForArea('lobby', 7000)) failures.push(`could not cross the entrance into the lobby; area=${await page.locator('.minimap').getAttribute('data-current-area')}; pose=${await page.locator('.minimap').getAttribute('data-player-z')}`)
await page.keyboard.up('w')

// Verify a corridor doorway actually leads into a named gallery.
await page.goto(`${baseUrl}/?view=door`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.locator('canvas').waitFor({ state: 'visible', timeout: 60000 })
await page.getByRole('button', { name: /bắt đầu tham quan/i }).click()
await page.waitForTimeout(2500)
await page.keyboard.down('a')
if (!await waitForArea('room-1', 10000)) failures.push(`could not walk through the Room 01 doorway; area=${await page.locator('.minimap').getAttribute('data-current-area')}; pose=${await page.locator('.minimap').getAttribute('data-player-x')}`)
await page.keyboard.up('a')

await browser.close()
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('Smoke test passed')
}
