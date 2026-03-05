/**
 * PDF Generation Configuration
 *
 * Centralized configuration for PDF generation settings
 */

export const PDF_CONFIG = {
  // Browser settings
  browser: {
    maxUsageCount: 50, // Close browser after N uses to prevent memory leaks
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process',
      '--disable-ipc-flooding-protection',
      '--disable-print-preview',
      '--disable-speech-api',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--hide-scrollbars',
      '--ignore-certificate-errors',
      '--mute-audio'
    ]
  },

  // Page settings
  page: {
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2
    },
    timeout: 30000, // 30 seconds
    waitUntil: 'networkidle0'
  },

  // PDF generation settings
  pdf: {
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: false,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    }
  },

  // Performance settings
  performance: {
    enableParallelRequests: true,
    maxConcurrentPDFs: 5
  },

  // Logging
  logging: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    includeTimings: true
  },

  // Feature flags
  features: {
    browserReuse: true,
    imageOptimization: true,
    cssMinification: false
  }
}

/**
 * Get environment-specific config
 */
export function getConfig() {
  const env = process.env.NODE_ENV || 'development'

  if (env === 'production') {
    return {
      ...PDF_CONFIG,
      browser: {
        ...PDF_CONFIG.browser,
        maxUsageCount: 100 // More aggressive reuse in production
      },
      page: {
        ...PDF_CONFIG.page,
        timeout: 60000 // Longer timeout in production
      }
    }
  }

  return PDF_CONFIG
}

export default getConfig()
