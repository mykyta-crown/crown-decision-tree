/**
 * Puppeteer service for PDF generation (server-only)
 * - Un seul point d'entrée public : generatePdfFromHtml(html, pdfOptions)
 * - Mutex de lancement + retries ciblés ETXTBSY
 * - Prod (Vercel): puppeteer-core + @sparticuz/chromium
 * - Dev: tente puppeteer (optionnel), sinon puppeteer-core + @sparticuz/chromium
 */

let _browserPromise = null
let _launchLock = null

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function isServerless() {
  return !!process.env.VERCEL || !!process.env.AWS_REGION || process.env.NITRO_PRESET === 'vercel'
}

/**
 * Charge (lazy) puppeteer et chromium selon l'environnement.
 */
async function loadEngines() {
  if (isServerless()) {
    const [{ default: chromium }, puppeteerCore] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core')
    ])
    const puppeteer = puppeteerCore.default || puppeteerCore
    return { puppeteer, chromium, isCore: true }
  }

  // Dev local : on essaye d'abord puppeteer (qui vient avec son Chrome),
  // sinon on retombe sur puppeteer-core + chromium (si dispo).
  try {
    const puppeteer = (await import('puppeteer')).default
    return { puppeteer, chromium: null, isCore: false }
  } catch {
    const [{ default: chromium }, puppeteerCore] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core')
    ])
    const puppeteer = puppeteerCore.default || puppeteerCore
    return { puppeteer, chromium, isCore: true }
  }
}

async function launchBrowserOnce() {
  const { puppeteer, chromium, isCore } = await loadEngines()

  if (isCore) {
    // Serverless (ou fallback dev avec core+chromium)
    if (chromium.setGraphicsMode) {
      try {
        await chromium.setGraphicsMode(false)
      } catch {
        // Ignore graphics mode errors
      }
    }

    const execPath = await chromium.executablePath()

    // sécurise les perms et la présence du binaire
    try {
      const { access, chmod } = await import('node:fs/promises')
      try {
        await chmod(execPath, 0o755)
      } catch {
        // Ignore chmod errors
      }
      for (let i = 0; i < 10; i++) {
        try {
          await access(execPath)
          break
        } catch {
          await sleep(100)
        }
      }
    } catch {
      // Ignore fs/promises import errors
    }

    const args = [
      ...chromium.args,
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--single-process',
      '--no-zygote'
    ]

    // retries ciblés ETXTBSY
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const browser = await puppeteer.launch({
          args,
          defaultViewport: chromium.defaultViewport,
          executablePath: execPath,
          headless: chromium.headless,
          ignoreHTTPSErrors: true
        })
        return browser
      } catch (e) {
        const msg = String(e?.message || '')
        const isBusy = e?.code === 'ETXTBSY' || /text file busy|ETXTBSY/i.test(msg)
        if (isBusy && attempt < 5) {
          await sleep(150 * attempt)
          continue
        }
        throw e
      }
    }
  } else {
    // Dev local avec puppeteer complet
    return puppeteer.launch({
      headless: 'new',
      args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox']
    })
  }
}

/**
 * Retourne une instance de browser avec single-flight (mutex)
 */
async function getBrowser() {
  if (!_browserPromise) {
    if (!_launchLock) {
      _launchLock = (async () => {
        const b = await launchBrowserOnce()
        return JSON.stringify({ ok: true })
      })()
    }
    await _launchLock
    _browserPromise = launchBrowserOnce()
  }
  return _browserPromise
}

/**
 * Public API: génère un PDF à partir d'un HTML complet
 */
export async function generatePdfFromHtml(htmlContent, pdfOptions = {}) {
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
    // Use 'load' instead of 'networkidle0' - faster and more reliable for base64 embedded images
    await page.setContent(htmlContent, { waitUntil: 'load', timeout: 60_000 })
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
      ...pdfOptions
    })
    await page.close()
    return pdf
  } catch (e) {
    try {
      await page.close()
    } catch {
      // Ignore page close errors
    }
    throw e
  }
}

// (optionnel) Fermeture gracieuse si le runtime le permet
async function closeBrowser() {
  if (_browserPromise) {
    try {
      ;(await _browserPromise).close()
    } catch {
      // Ignore browser close errors
    }
    _browserPromise = null
    _launchLock = null
  }
}

process.on?.('SIGTERM', closeBrowser)
process.on?.('SIGINT', closeBrowser)
