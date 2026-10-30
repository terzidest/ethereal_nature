// Refreshes the README screenshots from the live deployment.
// Uses the system Chrome via playwright-core (no browser download). Run from
// any scratch directory that has it installed — it is deliberately NOT a repo
// dependency:
//   cd $(mktemp -d) && npm i playwright-core && node <repo>/docs/screenshots/capture.mjs
// Output lands next to this script.
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(join(process.cwd(), 'noop.js'))('playwright-core')

const OUT = dirname(fileURLToPath(import.meta.url))
const STORE = 'https://eth-nature.terzidest.com'
const ADMIN = 'https://eth-nature-admin.terzidest.com'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 90 })

await page.goto(`${STORE}/`, { waitUntil: 'networkidle' })
await shot('storefront-home')

await page.goto(`${STORE}/products`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200) // let product photos decode
await shot('storefront-catalog')

await page.getByText('Lavender Essential Oil').first().click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
await shot('storefront-product')

await page.getByRole('button', { name: 'Add to cart' }).click()
await page.waitForTimeout(800)
await shot('storefront-cart')

await page.goto(`${ADMIN}/login`, { waitUntil: 'networkidle' })
await shot('admin-login')

await page.getByRole('button', { name: 'Explore the demo' }).click()
// Wait for real dashboard content — the URL flips before React swaps views.
await page.getByText('Demo mode — read only.').waitFor({ timeout: 15000 })
await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ timeout: 15000 })
await page.waitForLoadState('networkidle')
await page.waitForTimeout(500)
await shot('admin-dashboard')

await page.goto(`${ADMIN}/products`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await shot('admin-products')

await browser.close()
console.log('screenshots refreshed in', OUT)
