/**
 * PDF Generation Utilities - Main Export
 *
 * This module provides all utilities needed for PDF generation
 * in the Crown eAuction platform.
 *
 * @module pdfGeneration
 */

// Template and HTML generation
export { generateCoverPageHtml } from './coverPageTemplate.js'
export { generatePdfHtml, generateScreenshotsHtml } from './htmlTemplate.js'

// Puppeteer service
export { initBrowser, getBrowser, closeBrowser, generatePdfFromHtml } from './puppeteerService.js'

// Helpers and validation
export { getAuctionStatus, validateAuctionData, validateImagesData } from './helpers.js'

// Styles
export { PDF_STYLES } from './styles.js'
