import { generatePdfFromHtml } from '../pdfGeneration/puppeteerService'
import { PDF_STYLES } from '../pdfGeneration/styles'
import { generateCoverPageHtml } from './templates/coverPage.js'
import { generateLotSeparatorPage } from './templates/lotSeparator.js'
import { generatePageHeader } from './templates/common.js'

export async function generatePdfHtml(images, coverPageData, options = {}) {
  // Cover
  let coverPageHtml = ''
  if (coverPageData) {
    coverPageHtml = await generateCoverPageHtml(coverPageData)
  }

  // Screenshots
  let screenshotsHtml = ''
  for (const img of images) {
    if (img.lotData && (!img.data || img.data === '')) {
      if (img.title === 'Lot Separator') {
        screenshotsHtml += await generateLotSeparatorPage(img.lotData)
      }
    } else if (img.data) {
      const pageTitle = img.lotContext || (img.title ? img.title.toUpperCase() : 'PAGE')
      screenshotsHtml += `
        <div class="screenshot-page">
          ${generatePageHeader(pageTitle)}
          <div class="screenshot-container">
            <img src="${img.data}" alt="${img.title || 'Screenshot'}" class="screenshot-image">
          </div>
        </div>`
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>${PDF_STYLES}</style>
      </head>
      <body>${coverPageHtml}${screenshotsHtml}</body>
    </html>`
}

export async function createPdfFromHtml(htmlContent, options = {}) {
  const pdfOptions = {
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
    ...options
  }
  console.log('[PDF Generation] Starting PDF generation with Puppeteer...')
  const pdf = await generatePdfFromHtml(htmlContent, pdfOptions)
  console.log('[PDF Generation] PDF generated successfully')
  return pdf
}

export async function generatePdf(images, coverPageData, options = {}) {
  const htmlContent = await generatePdfHtml(images, coverPageData, options)
  return await createPdfFromHtml(htmlContent, options.pdfOptions)
}
