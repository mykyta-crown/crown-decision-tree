/**
 * Cover Page Template (public assets + VERCEL_URL)
 */
import { CROWN_LOGO_SVG } from './common'
import fs from 'node:fs/promises'
import path from 'node:path'

// cache en mémoire (évite de re-fetch à chaque export)
let COVER_ILLUSTRATION_DATA_URL = null

function computeBaseUrl() {
  // Utilise en priorité NUXT_PUBLIC_SITE_URL si présent (pratique pour local/prod custom)
  if (process.env.NUXT_PUBLIC_SITE_URL) {
    const raw = process.env.NUXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
    try {
      const parsed = new URL(raw)
      // For local development, always prefer http to avoid TLS issues with localhost
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        parsed.protocol = 'http:'
        return parsed.origin
      }
      return parsed.origin
    } catch {
      return raw
    }
  }
  // Environnements Vercel (Preview/Prod) -> injecté automatiquement
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Dev local
  const port = process.env.NITRO_PORT || process.env.PORT || 3000
  return `http://localhost:${port}`
}

async function loadCoverIllustration() {
  if (COVER_ILLUSTRATION_DATA_URL !== null) return COVER_ILLUSTRATION_DATA_URL

  const base = computeBaseUrl()
  const url = `${base}/pdf-assets/cover-illustration.png`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    COVER_ILLUSTRATION_DATA_URL = `data:image/png;base64,${buf.toString('base64')}`
    console.log('[PDF Templates] ✅ Cover illustration loaded from', url)
  } catch (err) {
    console.warn('[PDF Templates] ⚠️ Cover illustration failed:', err.message, 'url=', url)
    // Fallback: try to read from filesystem (useful in local/dev or when network is restricted)
    try {
      const filePath = path.resolve(process.cwd(), 'public/pdf-assets/cover-illustration.png')
      const buf = await fs.readFile(filePath)
      COVER_ILLUSTRATION_DATA_URL = `data:image/png;base64,${buf.toString('base64')}`
      console.log('[PDF Templates] ✅ Cover illustration loaded from filesystem', filePath)
    } catch (fsErr) {
      console.warn(
        '[PDF Templates] ⚠️ Cover illustration filesystem fallback failed:',
        fsErr.message
      )
      COVER_ILLUSTRATION_DATA_URL = ''
    }
  }

  return COVER_ILLUSTRATION_DATA_URL
}

export async function generateCoverPageHtml(coverData) {
  const COVER_ILLUSTRATION = await loadCoverIllustration()
  const {
    auctionName = 'eAuction',
    formattedDate = 'N/A',
    client = 'Client name',
    buyer = 'Buyer name',
    auctionTypeLabel = 'N/A'
  } = coverData || {}

  return `
    <div class="cover-page">
      <div class="cover-content">
        <div class="cover-left">
          <div class="cover-logo">${CROWN_LOGO_SVG}</div>
          <div class="cover-main-content">
            <div class="cover-title-wrapper">
              <h1 class="cover-main-title">eAuction<br>Summary Report</h1>
            </div>
            <div class="cover-divider"></div>
            <div class="cover-info-list">
              <div class="cover-info-item"><div class="cover-info-label">Client:</div><div class="cover-info-value">${client}</div></div>
              <div class="cover-info-item"><div class="cover-info-label">Buyer:</div><div class="cover-info-value">${buyer}</div></div>
              <div class="cover-info-item"><div class="cover-info-label">eAuction name:</div><div class="cover-info-value">${auctionName}</div></div>
              <div class="cover-info-item"><div class="cover-info-label">Date:</div><div class="cover-info-value">${formattedDate}</div></div>
              <div class="cover-info-item"><div class="cover-info-label">eAuction type:</div><div class="cover-info-value">${auctionTypeLabel}</div></div>
            </div>
          </div>
        </div>
        <div class="cover-illustration">
          ${
            COVER_ILLUSTRATION
              ? `<img src="${COVER_ILLUSTRATION}" alt="Cover illustration" class="cover-illustration-img" />`
              : '<div class="cover-illustration-fallback">Illustration unavailable</div>'
          }
        </div>
      </div>
    </div>
  `
}
