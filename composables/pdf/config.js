/**
 * PDF Export Configuration
 * Centralized configuration for client-side PDF export
 */

export const PDF_EXPORT_CONFIG = {
  layout: {
    desktopWidth: 1920, // Wider for better Activity Log rendering
    waitAfterFreeze: 100 // ms
  },
  capture: {
    scale: 2,
    quality: 0.92, // Higher JPEG quality
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true
  },
  navigation: {
    maxRetries: 20,
    componentLoadDelay: 3000, // ms to wait for components to load
    tabSwitchDelay: 800, // ms to wait after tab switch
    basicInfoRetries: 5,
    basicInfoRetryDelay: 500, // ms
    // Panel dataset verification - exponential backoff delays in ms
    panelDatasetRetries: 8,
    panelDatasetDelays: [400, 800, 1200, 1600, 2000, 2500, 3000, 3500],
    // Lot navigation verification
    lotVerificationMaxWait: 5000, // max ms to wait for lot data to update
    lotVerificationInterval: 300, // ms between checks
    // Critical panels that must have correct lot ID
    // dashboard-capture is most important - it contains Timer, Pricing, Activity Log, Chart
    criticalPanels: [
      'dashboard-capture',
      'terms-rules-panel',
      'terms-ceiling-panel',
      'prebid-approval-capture'
    ],
    // DOM stability check
    domStabilityInterval: 100, // ms between stability checks
    domStabilityThreshold: 200, // ms of no changes required
    domStabilityMaxWait: 3000 // max ms to wait for stability
  },
  // Verbose logging for debugging
  verboseLogging: true,
  elements: {
    lotsSummary: 'lots-summary-capture',
    basicInfo: 'basic-info-capture',
    activityLog: 'activity-log-capture',
    dashboard: 'dashboard-capture',
    terms: 'terms-capture',
    prebid: 'prebid-capture'
  },
  export: {
    filename: (auctionName, timestamp) => `auction-${auctionName}-${timestamp}.pdf`,
    apiEndpoint: (auctionId) => `/api/auctions/${auctionId}/export-pdf`
  }
}
