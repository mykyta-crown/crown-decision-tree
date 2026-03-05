/**
 * Lot Separator Template (public assets + VERCEL_URL)
 */
import { generatePageHeader } from './common'
import fs from 'node:fs/promises'
import path from 'node:path'

// cache en mémoire
let LOT_SEPARATOR_ILLUSTRATION_SVG = null

function computeBaseUrl() {
  if (process.env.NUXT_PUBLIC_SITE_URL) {
    const raw = process.env.NUXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
    try {
      const parsed = new URL(raw)
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        parsed.protocol = 'http:'
        return parsed.origin
      }
      return parsed.origin
    } catch {
      return raw
    }
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  const port = process.env.NITRO_PORT || process.env.PORT || 3000
  return `http://localhost:${port}`
}

async function loadLotSeparatorIllustration() {
  if (LOT_SEPARATOR_ILLUSTRATION_SVG !== null) return LOT_SEPARATOR_ILLUSTRATION_SVG

  const base = computeBaseUrl()
  const url = `${base}/pdf-assets/lot-separator-illustration.svg`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    LOT_SEPARATOR_ILLUSTRATION_SVG = await res.text()
    console.log('[PDF Templates] ✅ Lot separator SVG loaded from', url)
  } catch (err) {
    console.warn('[PDF Templates] ⚠️ Lot separator failed:', err.message, 'url=', url)
    // Fallback: read from filesystem if available
    try {
      const filePath = path.resolve(
        process.cwd(),
        'public/pdf-assets/lot-separator-illustration.svg'
      )
      LOT_SEPARATOR_ILLUSTRATION_SVG = await fs.readFile(filePath, 'utf8')
      console.log('[PDF Templates] ✅ Lot separator SVG loaded from filesystem', filePath)
    } catch (fsErr) {
      console.warn('[PDF Templates] ⚠️ Lot separator filesystem fallback failed:', fsErr.message)
      LOT_SEPARATOR_ILLUSTRATION_SVG =
        '<svg width="308" height="332" viewBox="0 0 308 332" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14">No illustration</text></svg>'
    }
  }

  return LOT_SEPARATOR_ILLUSTRATION_SVG
}

export async function generateLotSeparatorPage(lotData) {
  const LOT_SEPARATOR_ILLUSTRATION = await loadLotSeparatorIllustration()
  const lotNumber = lotData?.lotNumber || '1'
  const lotTitle = lotData?.lotTitle || 'Lot title'
  const lineItems = lotData?.lineItems || []

  const lineItemsHtml = lineItems
    .map((item, i) => {
      const idx = (i + 1).toString().padStart(2, '0')
      const code = item.code || `LI-${idx}`
      const desc = item.description || item.name || ''
      return `<p class="lot-sep-line-item">${code}: ${desc}</p>`
    })
    .join('')

  return `
    <div class="lot-separator-page">
      ${generatePageHeader('LOT ' + lotNumber + ' - ' + lotTitle)}
      <div class="lot-sep-content">
        <div class="lot-sep-left">
          <div class="lot-sep-title-section">
            <p class="lot-sep-label">Lot ${lotNumber}</p>
            <h1 class="lot-sep-title">${lotTitle}</h1>
          </div>
          ${
            lineItems.length
              ? `<div class="lot-sep-line-items">
                  <p class="lot-sep-section-label">Line items</p>
                  <div class="lot-sep-items-list">${lineItemsHtml}</div>
                 </div>`
              : ''
          }
        </div>
        <div class="lot-sep-right">
          ${LOT_SEPARATOR_ILLUSTRATION}
        </div>
      </div>
    </div>
  `
}
