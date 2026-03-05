/**
 * PDF HTML Template with inline styles
 */

import { PDF_STYLES } from './styles.js'

/**
 * Generate screenshots HTML
 */
export function generateScreenshotsHtml(images) {
  return images
    .map(
      (img, index) => `
      <div class="section">
        <h2 class="section-title">${img.title || `Section ${index + 1}`}</h2>
        <div class="image-container">
          <img src="${img.data}" alt="${img.title || 'Screenshot'}" loading="lazy">
        </div>
      </div>
    `
    )
    .join('')
}

/**
 * Generate complete HTML for PDF
 */
export function generatePdfHtml({ coverPageHtml, imagesHtml, auctionName, auctionId }) {
  const currentDate = new Date().toLocaleString('fr-FR')

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>${PDF_STYLES}</style>
      </head>
      <body>
        ${coverPageHtml}

        <div class="screenshots-page">
          <div class="header">
            <h1>Auction Report - ${auctionName || 'eAuction'}</h1>
            <div class="subtitle">Generated on ${currentDate}</div>
            <div class="subtitle">Auction ID: ${auctionId}</div>
          </div>
          ${imagesHtml}
          <div class="footer">
            <p>Crown eAuction Platform</p>
          </div>
        </div>
      </body>
    </html>
  `
}
