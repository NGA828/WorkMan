// Captures the screenshots used in the WorkMan user guide.
// Prerequisites: the frontend running on :5173 and a freshly seeded API on :8000
//   (e.g. `node frontend/dev/mock-api.mjs --fresh` + `npm run dev` in frontend/).
// Fonts are served locally from @fontsource so captures also work offline.
// Usage: npm install && npm run screenshots [-- <shot-name> ...]
import puppeteer from 'puppeteer'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'http://localhost:5173'
const API = 'http://localhost:8000/api'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = process.env.OUT || path.join(HERE, '..', 'screenshots')
const ONLY = process.argv.slice(2)
fs.mkdirSync(OUT, { recursive: true })

const FONT_DIR = path.join(HERE, 'node_modules', '@fontsource')
const fontCss = [400, 500, 600, 700, 800]
  .map((w) => `@font-face{font-family:'DM Sans';font-style:normal;font-weight:${w};src:url(https://fonts.local/dm-sans/dm-sans-latin-${w}-normal.woff2) format('woff2');}`)
  .join('\n') +
  `@font-face{font-family:'DM Serif Display';font-style:normal;font-weight:400;src:url(https://fonts.local/dm-serif-display/dm-serif-display-latin-400-normal.woff2) format('woff2');}` +
  `@font-face{font-family:'DM Serif Display';font-style:italic;font-weight:400;src:url(https://fonts.local/dm-serif-display/dm-serif-display-latin-400-italic.woff2) format('woff2');}`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function login(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password' }),
  })
  const data = await res.json()
  return data.token
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--font-render-hinting=none'],
  headless: true,
})

async function newPage(token) {
  const ctx = await browser.createBrowserContext()
  await ctx.overridePermissions(BASE, ['geolocation'])
  const page = await ctx.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 })
  await page.setGeolocation({ latitude: 4.0511, longitude: 9.7679 })
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const url = req.url()
    if (url.startsWith('https://fonts.googleapis.com')) {
      return req.respond({ status: 200, contentType: 'text/css', body: fontCss })
    }
    if (url.startsWith('https://fonts.local/')) {
      const rel = url.replace('https://fonts.local/', '')
      const [pkg, file] = rel.split('/')
      return req.respond({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(path.join(FONT_DIR, pkg, 'files', file)) })
    }
    if (!url.startsWith('http://localhost') && !url.startsWith('data:') && !url.startsWith('blob:')) {
      return req.abort()
    }
    return req.continue()
  })
  if (token) {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle2' })
    await page.evaluate((t) => localStorage.setItem('workman_token', t), token)
  }
  return page
}

async function settle(page, ms = 900) {
  try { await page.waitForNetworkIdle({ idleTime: 400, timeout: 8000 }) } catch {}
  await page.evaluate(() => document.fonts.ready)
  // hide transient toasts
  await page.addStyleTag({ content: '.toast-stack,.toasts,[class*="toast"]{display:none!important}' }).catch(() => {})
  await sleep(ms)
}

async function shot(page, name, opts = {}) {
  if (ONLY.length && !ONLY.includes(name)) return
  const file = path.join(OUT, `${name}.jpg`)
  if (opts.element) {
    const box = await (await page.$(opts.element)).boundingBox()
    const pad = 36
    opts.clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 }
    opts.fullPage = !!opts.fullPageClip
  }
  await page.screenshot({ path: file, type: 'jpeg', quality: 82, fullPage: Boolean(opts.fullPage), clip: opts.clip })
  console.log('saved', name)
}

async function go(page, route, ms) {
  await page.goto(BASE + route, { waitUntil: 'networkidle2' })
  await settle(page, ms)
}

async function click(page, selector) {
  const el = await page.waitForSelector(selector, { timeout: 5000 })
  await el.click()
  await sleep(500)
}

// ---------- Public ----------
{
  const page = await newPage()
  await go(page, '/', 1200)
  await shot(page, '01-landing')
  await page.setViewport({ width: 1440, height: 1300, deviceScaleFactor: 1.5 })
  await go(page, '/register')
  await page.type('input[placeholder="Your name"]', 'Paul Essomba')
  await page.type('input[type=email]', 'paul@example.com')
  await page.type('input[placeholder^="+237"]', '+237 677 12 34 56')
  await page.type('input[placeholder="Douala"]', 'Yaoundé')
  await sleep(300)
  await shot(page, '02-register', { element: '.auth-card' })
  await go(page, '/login')
  await page.type('input[type=email]', 'client@workman.local')
  await page.type('input[type=password]', 'password')
  await sleep(300)
  await shot(page, '03-login', { element: '.auth-card' })
  await page.browserContext().close()
}

// ---------- Client ----------
{
  const clientToken = await login('client@workman.local')
  for (const id of [1, 2]) {
    await fetch(`${API}/technicians/${id}/favorite`, { method: 'POST', headers: { Authorization: `Bearer ${clientToken}`, Accept: 'application/json' } })
  }
  const page = await newPage(clientToken)
  await go(page, '/dashboard')
  await shot(page, '10-client-overview')
  await click(page, '.bell-trigger')
  await sleep(400)
  await shot(page, '11-notifications')
  await go(page, '/dashboard/discover')
  await shot(page, '12-discover')
  await go(page, '/dashboard/technicians/1')
  await shot(page, '13-technician-profile')
  await click(page, 'button ::-p-text(Book)')
  await sleep(500)
  await shot(page, '14-booking-form')
  await go(page, '/dashboard/technicians/1')
  await click(page, 'button ::-p-text(Book with AI)')
  await sleep(500)
  await shot(page, '15-booking-assistant')
  await go(page, '/dashboard/bookings')
  await shot(page, '16-bookings')
  await click(page, 'button ::-p-text(Pay transport fee)')
  await sleep(500)
  await shot(page, '17-pay-transport')
  await page.type('#payment-phone', '670000000')
  await click(page, '.modal button.btn-dark:not([type=button])')
  await settle(page, 1200)
  await go(page, '/dashboard/bookings')
  const reviewTab = await page.$('button.tab ::-p-text(Completed)')
  if (reviewTab) { await reviewTab.click(); await sleep(600) }
  await shot(page, '18-bookings-completed')
  await go(page, '/dashboard/bookings')
  const payTab = await page.$('button.tab ::-p-text(Payments)')
  if (payTab) { await payTab.click(); await sleep(800) }
  await shot(page, '19-payments')
  await go(page, '/dashboard/bookings')
  await click(page, 'button ::-p-text(Report issue)')
  await sleep(400)
  await shot(page, '20-report-issue')
  await go(page, '/dashboard/tracking/6', 1500)
  await shot(page, '21-tracking')
  await go(page, '/dashboard/favorites')
  await shot(page, '22-favorites')
  await go(page, '/dashboard/messages')
  const convo = await page.$('.conversation-item, .conversation, .convo-item, .messages-list button')
  if (convo) { await convo.click(); await settle(page, 600) }
  await shot(page, '23-messages')
  await go(page, '/dashboard/assistant')
  for (const q of ['How do I book a technician?', 'How do I pay?']) {
    const b = await page.$(`button ::-p-text(${q})`)
    if (b) { await b.click(); await sleep(500) }
  }
  await sleep(600)
  await shot(page, '24-assistant')
  await go(page, '/dashboard/settings')
  await shot(page, '25-settings')
  await page.browserContext().close()
}

// ---------- Technician ----------
{
  const page = await newPage(await login('michael@workman.local'))
  await go(page, '/dashboard')
  await shot(page, '30-tech-overview')
  await go(page, '/dashboard/jobs')
  await shot(page, '31-tech-jobs')
  const accept = await page.$('button.btn-dark ::-p-text(Accept)')
  if (accept) { await accept.click(); await sleep(600); await shot(page, '32-tech-accept') }
  await go(page, '/dashboard/profile-setup')
  await shot(page, '33-tech-profile')
  await go(page, '/dashboard/history')
  await shot(page, '34-tech-history')
  await page.browserContext().close()
}
{
  const page = await newPage(await login('eric@workman.local'))
  await go(page, '/dashboard')
  await shot(page, '35-tech-pending')
  await page.browserContext().close()
}

// ---------- Admin ----------
{
  const page = await newPage(await login('admin@workman.local'))
  const routes = [
    ['40-admin-overview', '/dashboard'],
    ['41-admin-verification', '/dashboard/verification'],
    ['42-admin-users', '/dashboard/users'],
    ['43-admin-categories', '/dashboard/categories'],
    ['44-admin-bookings', '/dashboard/platform-bookings'],
    ['45-admin-reviews', '/dashboard/reviews'],
    ['46-admin-reports', '/dashboard/reports'],
  ]
  for (const [name, route] of routes) {
    await go(page, route)
    await shot(page, name)
  }
  await page.browserContext().close()
}

await browser.close()
