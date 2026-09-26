// Builds WorkMan-User-Guide.pdf from user-guide.html (fonts embedded, footer on every page except the cover).
// Usage: npm install && npm run pdf
import puppeteer from 'puppeteer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const FONT_DIR = path.join(HERE, 'node_modules', '@fontsource')
const src = path.resolve(process.argv[2] || path.join(HERE, '..', 'user-guide.html'))
const out = path.resolve(process.argv[3] || path.join(HERE, '..', 'WorkMan-User-Guide.pdf'))
let html = fs.readFileSync(src, 'utf8')
const f = (pkg, file) => `url(data:font/woff2;base64,${fs.readFileSync(`${FONT_DIR}/${pkg}/files/${file}`).toString('base64')}) format('woff2')`
const fonts = [400,500,600,700,800].map(w=>`@font-face{font-family:'DM Sans';font-weight:${w};font-style:normal;src:${f('dm-sans',`dm-sans-latin-${w}-normal.woff2`)}}@font-face{font-family:'DM Sans';font-weight:${w};font-style:italic;src:${f('dm-sans',`dm-sans-latin-${w}-italic.woff2`)}}`).join('')
 + `@font-face{font-family:'DM Serif Display';font-style:normal;src:${f('dm-serif-display','dm-serif-display-latin-400-normal.woff2')}}@font-face{font-family:'DM Serif Display';font-style:italic;src:${f('dm-serif-display','dm-serif-display-latin-400-italic.woff2')}}`
const mono = [400,700].map(w=>`@font-face{font-family:'JetBrains Mono';font-weight:${w};src:${f('jetbrains-mono',`jetbrains-mono-latin-${w}-normal.woff2`)}}`).join('')
html = html.replace('<style>', `<style>${fonts}${mono}`)
const tmp = src.replace(/\.html$/, '.render.html'); fs.writeFileSync(tmp, html)
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'], headless: true })
const page = await browser.newPage()
await page.goto('file://' + tmp, { waitUntil: 'networkidle0' })
await page.evaluate(() => document.fonts.ready)
await page.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: false,
  footerTemplate: `<div style="width:100%;font-family:sans-serif;font-size:7.5px;color:#8a949c;padding:0 16mm;display:flex;justify-content:space-between"><span>WorkMan · User Guide</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
  margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' }, preferCSSPageSize: true })
await browser.close(); fs.unlinkSync(tmp)
const pdf = await PDFDocument.load(fs.readFileSync(out))
const font = await pdf.embedFont(StandardFonts.Helvetica)
const pages = pdf.getPages()
pdf.setTitle('WorkMan — User Guide'); pdf.setAuthor('WorkMan'); pdf.setSubject('Setup and navigation guide for the WorkMan platform')
pages.forEach((pg, i) => {
  if (i === 0) return
  const { width } = pg.getSize(); const m = 45.35, y = 28, c = rgb(0.54, 0.58, 0.61)
  pg.drawText('WorkMan  ·  User Guide', { x: m, y, size: 7.5, font, color: c })
  const t = `Page ${i + 1} of ${pages.length}`
  pg.drawText(t, { x: width - m - font.widthOfTextAtSize(t, 7.5), y, size: 7.5, font, color: c })
  pg.drawLine({ start: { x: m, y: y + 12 }, end: { x: width - m, y: y + 12 }, thickness: 0.4, color: rgb(0.89, 0.87, 0.84) })
})
fs.writeFileSync(out, await pdf.save())
console.log('ok', (fs.statSync(out).size/1e6).toFixed(2)+'MB')
