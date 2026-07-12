import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173'
const label = process.argv[3] ?? 'museum'
const mode = process.argv[4] ?? 'all'
const outputDir = resolve('_artifacts')
const errors = []

await mkdir(outputDir, { recursive: true })
console.log(`Capturing ${baseUrl} into ${outputDir}`)

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
})

async function prepare(page, url) {
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 60000 })
}

async function enterMuseum(page) {
  await page.getByRole('button', { name: /bắt đầu tham quan|bước vào bảo tàng/i }).click()
  await page.locator('canvas').waitFor({ state: 'visible' })
  await page.waitForTimeout(4200)
}

async function screenshot(page, filename) {
  await page.screenshot({ path: resolve(outputDir, filename), animations: 'disabled', timeout: 90000 })
}

if (mode !== 'mobile') {
  const desktop = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
  await prepare(desktop, baseUrl)
  console.log('Desktop scene loaded')
  await desktop.waitForTimeout(3000)
  await screenshot(desktop, `${label}-intro.png`)
  console.log('Intro captured')
  await enterMuseum(desktop)
  await screenshot(desktop, `${label}-spawn.png`)
  console.log('Spawn captured')
  await desktop.close()

  for (const view of ['lobby', 'corridor', 'gallery-wide', 'gallery']) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
    await prepare(page, `${baseUrl}/?view=${view}`)
    await enterMuseum(page)
    await screenshot(page, `${label}-${view}.png`)
    console.log(`${view} captured`)
    if (view === 'gallery') {
      await page.keyboard.press('e')
      await page.waitForTimeout(700)
      if (await page.locator('.content-panel').isVisible()) {
        await screenshot(page, `${label}-exhibit-panel.png`)
        console.log('Exhibit panel captured')
      } else {
        errors.push('interaction: gallery poster did not open with E')
      }
    }
    await page.close()
  }
}

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true })
const mobile = await mobileContext.newPage()
await prepare(mobile, baseUrl)
await mobile.waitForTimeout(2500)
await screenshot(mobile, `${label}-mobile-intro.png`)
await enterMuseum(mobile)
await screenshot(mobile, `${label}-mobile-spawn.png`)
console.log('Mobile spawn captured')
console.log('Mobile intro captured')
await mobile.close()
await mobileContext.close()

await browser.close()

if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
}
