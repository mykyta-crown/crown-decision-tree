/**
 * PDF Export Main Orchestrator Composable
 * Coordinates screenshot capture, navigation, and API calls for PDF generation
 *
 * Flow:
 * 1. Capture screenshots as before
 * 2. Upload images to Supabase Storage (pdf-temp bucket)
 * 3. Send storage paths to server (not base64 data)
 * 4. Server downloads images, generates PDF, deletes temp files
 * 5. Client downloads PDF
 */

import html2canvas from 'html2canvas'
import { PDF_EXPORT_CONFIG } from './config'
import { usePdfCapture } from './usePdfCapture'
import { usePdfNavigation } from './usePdfNavigation'
import { clearAuctionMemoizeCache } from '../useUserAuctionBids'

export const usePdfExport = () => {
  const { t } = useTranslations()
  const supabase = useSupabaseClient()
  const route = useRoute()

  // Export state - useState is auto-imported in Nuxt 3
  const exportingPdf = useState('pdfExportButton', () => false)
  const exportProgress = useState('pdfExportProgress', () => '')
  const isExporting = useState('pdfExportOverlay', () => false)

  // Composables
  const {
    compressImage,
    captureById,
    captureElementWithRetry,
    captureActivityLogWithPagination,
    captureDashboardPart1,
    captureDashboardPart2,
    combinePanels,
    waitForElementById,
    combineImagesVertically
  } = usePdfCapture()

  const { fetchLots, filterBreakLots, navigateToLot, waitForComponentLoad, ensureFirstLot } =
    usePdfNavigation()

  const tabsState = useState('buyer-tabs', () => 0)

  /**
   * Verify that lot data has updated in all critical panels
   * Uses adaptive polling with configurable timeout
   * @param {string} expectedLotId - The lot ID we expect panels to show
   * @returns {Promise<boolean>} - True if all panels updated, false if timeout
   */
  async function verifyLotDataUpdated(expectedLotId) {
    const { criticalPanels, lotVerificationMaxWait, lotVerificationInterval } =
      PDF_EXPORT_CONFIG.navigation
    const verbose = PDF_EXPORT_CONFIG.verboseLogging

    const startTime = Date.now()
    let attempts = 0

    if (verbose) {
      console.log(`[PDF Export] Verifying lot data updated to ${expectedLotId}...`)
      console.log(`[PDF Export] Checking panels: ${criticalPanels.join(', ')}`)
    }

    while (Date.now() - startTime < lotVerificationMaxWait) {
      attempts++
      let allUpdated = true
      const panelStatuses = []

      for (const panelId of criticalPanels) {
        const element = document.getElementById(panelId)
        const currentLotId = element?.dataset?.auctionId || null

        if (currentLotId === expectedLotId) {
          panelStatuses.push({ panelId, status: 'OK', lotId: currentLotId })
        } else {
          allUpdated = false
          panelStatuses.push({ panelId, status: 'WAITING', lotId: currentLotId || 'not found' })
        }
      }

      if (allUpdated) {
        if (verbose) {
          console.log(
            `[PDF Export] ✓ All panels verified for lot ${expectedLotId} after ${attempts} attempts (${Date.now() - startTime}ms)`
          )
        }
        return true
      }

      if (verbose && attempts % 5 === 0) {
        console.log(`[PDF Export] Panel status after ${attempts} attempts:`)
        panelStatuses.forEach(({ panelId, status, lotId }) => {
          console.log(`  - ${panelId}: ${status} (lot: ${lotId})`)
        })
      }

      await new Promise((resolve) => setTimeout(resolve, lotVerificationInterval))
    }

    // Log final status on timeout
    console.warn(
      `[PDF Export] Timeout waiting for panels to update to lot ${expectedLotId} after ${attempts} attempts (${Date.now() - startTime}ms)`
    )
    criticalPanels.forEach((panelId) => {
      const element = document.getElementById(panelId)
      const currentLotId = element?.dataset?.auctionId || 'not found'
      console.warn(`  - ${panelId}: lot ${currentLotId}`)
    })

    return false
  }

  /**
   * Generate unique export session ID
   * Used to group all images for a single PDF export
   */
  function generateExportSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Convert base64 data URL to Blob
   * @param {string} dataUrl - Base64 encoded data URL
   * @returns {Blob} - File blob
   */
  function dataUrlToBlob(dataUrl) {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  /**
   * Upload a single image to Supabase Storage
   * @param {string} base64Data - Base64 encoded image
   * @param {string} userId - User ID for folder structure
   * @param {string} sessionId - Export session ID
   * @param {string} filename - Image filename
   * @returns {Promise<string>} - Storage path
   */
  async function uploadImageToStorage(base64Data, userId, sessionId, filename) {
    const blob = dataUrlToBlob(base64Data)
    const storagePath = `${userId}/${sessionId}/${filename}`

    console.log(
      `[PDF Export] Uploading ${filename} (${Math.round(blob.size / 1024)} KB, type: ${blob.type})...`
    )
    console.log(`[PDF Export] Storage path: ${storagePath}`)

    try {
      const { data, error } = await supabase.storage.from('pdf-temp').upload(storagePath, blob, {
        contentType: blob.type,
        upsert: false
      })

      if (error) {
        console.error(`[PDF Export] Upload error for ${filename}:`, error)
        console.error(`[PDF Export] Error details:`, JSON.stringify(error, null, 2))
        throw new Error(`Failed to upload image: ${error.message || 'Unknown storage error'}`)
      }

      console.log(`[PDF Export] Uploaded ${filename} to storage successfully`)
      return storagePath
    } catch (err) {
      console.error(`[PDF Export] Upload exception for ${filename}:`, err)
      // Check if it's a network/fetch error that returned HTML
      if (err.message?.includes('Unexpected token')) {
        throw new Error(
          'Storage bucket "pdf-temp" may not exist. Please create it in Supabase Dashboard (Storage > New bucket > "pdf-temp", Private).'
        )
      }
      throw err
    }
  }

  /**
   * Cleanup uploaded images on error
   * @param {string[]} paths - Array of storage paths to delete
   */
  async function cleanupUploadedImages(paths) {
    if (!paths || paths.length === 0) return

    console.log(`[PDF Export] Cleaning up ${paths.length} uploaded images...`)
    try {
      const { error } = await supabase.storage.from('pdf-temp').remove(paths)
      if (error) {
        console.warn('[PDF Export] Cleanup warning:', error.message)
      } else {
        console.log('[PDF Export] Cleanup completed')
      }
    } catch (err) {
      console.warn('[PDF Export] Cleanup failed:', err)
    }
  }

  function getTabButtons() {
    const tabContainer = document.querySelector('.v-tabs')
    if (!tabContainer) {
      return []
    }
    return Array.from(tabContainer.querySelectorAll('.v-tab'))
  }

  function getDomActiveTabIndex(buttons = getTabButtons()) {
    return buttons.findIndex(
      (btn) =>
        btn.classList.contains('v-tab--selected') || btn.getAttribute('aria-selected') === 'true'
    )
  }

  /**
   * Wait for DOM content to stabilize (no dimension changes for a threshold period)
   * This helps ensure tab content has fully rendered before capturing
   * @param {HTMLElement} container - Container element to monitor
   * @param {object} options - Stability options
   * @returns {Promise<boolean>} - True if stable, false if timeout
   */
  async function waitForDomStability(container, options = {}) {
    const {
      interval = PDF_EXPORT_CONFIG.navigation.domStabilityInterval,
      threshold = PDF_EXPORT_CONFIG.navigation.domStabilityThreshold,
      maxWait = PDF_EXPORT_CONFIG.navigation.domStabilityMaxWait
    } = options

    if (!container) {
      return true // No container to monitor
    }

    const verbose = PDF_EXPORT_CONFIG.verboseLogging
    const startTime = Date.now()
    let lastDimensions = { width: 0, height: 0 }
    let stableStart = null

    while (Date.now() - startTime < maxWait) {
      const rect = container.getBoundingClientRect()
      const currentDimensions = {
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }

      if (
        currentDimensions.width === lastDimensions.width &&
        currentDimensions.height === lastDimensions.height
      ) {
        // Dimensions unchanged
        if (!stableStart) {
          stableStart = Date.now()
        } else if (Date.now() - stableStart >= threshold) {
          // Stable for threshold period
          if (verbose) {
            console.log(
              `[PDF Export] DOM stable (${currentDimensions.width}x${currentDimensions.height}) after ${Date.now() - startTime}ms`
            )
          }
          return true
        }
      } else {
        // Dimensions changed, reset stability timer
        stableStart = null
        lastDimensions = currentDimensions
      }

      await new Promise((resolve) => setTimeout(resolve, interval))
    }

    if (verbose) {
      console.warn(`[PDF Export] DOM stability timeout after ${maxWait}ms`)
    }
    return false
  }

  async function ensureTabActive(targetIndex, options = {}) {
    const {
      maxAttempts = 3,
      delay = PDF_EXPORT_CONFIG.navigation.tabSwitchDelay,
      waitForStability = true
    } = options
    const verbose = PDF_EXPORT_CONFIG.verboseLogging

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (tabsState.value !== targetIndex) {
        tabsState.value = targetIndex
      }

      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, delay))

      const buttons = getTabButtons()
      const domActiveIndex = getDomActiveTabIndex(buttons)

      if (tabsState.value === targetIndex && domActiveIndex === targetIndex) {
        // Tab is active, now wait for content to stabilize
        if (waitForStability) {
          const tabContent = document.querySelector('.v-window-item--active')
          if (tabContent) {
            await waitForDomStability(tabContent)
          }
        }
        return true
      }

      if (buttons[targetIndex]) {
        if (verbose) {
          console.log(
            `[PDF Export] Tab ${targetIndex} not active (attempt ${attempt}/${maxAttempts}). Forcing click.`
          )
        }
        buttons[targetIndex].click()
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 200))

        const postClickDomIndex = getDomActiveTabIndex(buttons)
        if (postClickDomIndex === targetIndex) {
          tabsState.value = targetIndex
          // Wait for content stability after click
          if (waitForStability) {
            const tabContent = document.querySelector('.v-window-item--active')
            if (tabContent) {
              await waitForDomStability(tabContent)
            }
          }
          return true
        }
      } else {
        console.warn(`[PDF Export] Could not find tab button at index ${targetIndex}`)
      }
    }

    const finalButtons = getTabButtons()
    console.error(
      `[PDF Export] Failed to activate tab ${targetIndex} after ${maxAttempts} attempts. ` +
        `State value: ${tabsState.value}, DOM active index: ${getDomActiveTabIndex(finalButtons)}`
    )
    return false
  }

  async function ensureElementVisibleInTab(
    elementId,
    tabIndex,
    description,
    options = {},
    expectedLotId
  ) {
    const { attempts = 3, retries = 5, delay = 400 } = options

    // If we need to check lot ID, increase attempts and add more wait time
    const maxAttempts = expectedLotId ? Math.max(attempts, 5) : attempts
    const lotIdCheckDelay = 600

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const attemptDelay = attempt === 1 ? PDF_EXPORT_CONFIG.navigation.tabSwitchDelay : 600
      await ensureTabActive(tabIndex, { maxAttempts: 2, delay: attemptDelay })

      const element = await waitForElementById(elementId, {
        retries,
        delay,
        logPrefix: '[PDF Export]'
      })

      if (element) {
        if (expectedLotId) {
          const currentLotId = element.dataset?.auctionId || ''
          if (!currentLotId || currentLotId !== expectedLotId) {
            console.warn(
              `[PDF Export] ${description} (${elementId}) still showing lot ${currentLotId || 'unknown'}, waiting for ${expectedLotId} (attempt ${attempt}/${maxAttempts})`
            )
            // Wait longer and also trigger a tab re-activation to force refresh
            await new Promise((resolve) => setTimeout(resolve, lotIdCheckDelay))
            if (attempt < maxAttempts) {
              // Re-activate the tab to force component refresh
              await ensureTabActive(tabIndex, { maxAttempts: 1, delay: 300 })
            }
            continue
          }
        }

        return element
      }

      console.warn(
        `[PDF Export] ${description} (${elementId}) not visible after attempt ${attempt}/${maxAttempts}. ` +
          `Re-asserting tab ${tabIndex}...`
      )
    }

    const buttons = getTabButtons()
    console.error(
      `[PDF Export] ${description} (${elementId}) not visible after ${maxAttempts} attempts. ` +
        `Active tab state: ${tabsState.value}, DOM active index: ${getDomActiveTabIndex(buttons)}`
    )
    return null
  }

  async function ensurePanelsVisibleInTab(panelIds, tabIndex, description, expectedLotId) {
    for (const panelId of panelIds) {
      const element = await ensureElementVisibleInTab(
        panelId,
        tabIndex,
        `${description} panel`,
        { attempts: expectedLotId ? 5 : 2, retries: 5, delay: 500 },
        expectedLotId
      )

      if (!element) {
        return false
      }
    }

    return true
  }

  /**
   * Freeze layout to desktop width for consistent PDF export captures
   */
  function freezeLayoutForExport() {
    const html = document.documentElement
    const body = document.body
    const originalScrollX = window.scrollX
    const originalScrollY = window.scrollY

    // Store original styles
    const originalHtmlStyles = {
      width: html.style.width || '',
      maxWidth: html.style.maxWidth || '',
      margin: html.style.margin || '',
      overflow: html.style.overflow || ''
    }

    const originalBodyStyles = {
      width: body.style.width || '',
      maxWidth: body.style.maxWidth || '',
      margin: body.style.margin || '',
      overflow: body.style.overflow || ''
    }

    // Hide sidebar during export
    const sidebar = document.querySelector('.v-navigation-drawer')
    const originalSidebarDisplay = sidebar ? sidebar.style.display : null

    if (sidebar) {
      sidebar.style.setProperty('display', 'none', 'important')
    }

    // Inject style to remove text truncation and widen Activity Log during export
    const exportStyle = document.createElement('style')
    exportStyle.id = 'pdf-export-style'
    exportStyle.textContent = `
      .pdf-export-layout-frozen .text-truncate {
        overflow: visible !important;
        text-overflow: unset !important;
        white-space: normal !important;
      }
      .pdf-export-layout-frozen #activity-log-capture {
        max-width: none !important;
        width: 940px !important;
      }
      .pdf-export-layout-frozen .max-width {
        max-width: 100% !important;
      }
    `
    document.head.appendChild(exportStyle)

    // Apply fixed desktop width
    const width = `${PDF_EXPORT_CONFIG.layout.desktopWidth}px`
    html.style.setProperty('width', width, 'important')
    html.style.setProperty('max-width', width, 'important')
    html.style.setProperty('margin', '0 auto', 'important')
    html.style.setProperty('overflow', 'hidden', 'important')

    body.style.setProperty('width', width, 'important')
    body.style.setProperty('max-width', width, 'important')
    body.style.setProperty('margin', '0 auto', 'important')
    body.style.setProperty('overflow', 'hidden', 'important')

    html.classList.add('pdf-export-layout-frozen')

    // Return cleanup function
    return () => {
      const toCssProp = (prop) => prop.replace(/([A-Z])/g, '-$1').toLowerCase()

      // Remove injected export style
      const injectedStyle = document.getElementById('pdf-export-style')
      if (injectedStyle) {
        injectedStyle.remove()
      }

      // Restore sidebar
      if (sidebar) {
        if (originalSidebarDisplay) {
          sidebar.style.display = originalSidebarDisplay
        } else {
          sidebar.style.removeProperty('display')
        }
      }

      // Restore original styles
      Object.entries(originalHtmlStyles).forEach(([prop, value]) => {
        if (value) {
          html.style[prop] = value
        } else {
          html.style.removeProperty(toCssProp(prop))
        }
      })

      Object.entries(originalBodyStyles).forEach(([prop, value]) => {
        if (value) {
          body.style[prop] = value
        } else {
          body.style.removeProperty(toCssProp(prop))
        }
      })

      html.classList.remove('pdf-export-layout-frozen')
      // Restore scroll position
      try {
        window.scrollTo(originalScrollX, originalScrollY)
      } catch {
        // Ignore scroll errors
      }
    }
  }

  /**
   * Capture lots summary table (for multi-lot auctions)
   * @param {string} expectedGroupId - The expected group ID to verify data freshness
   */
  async function captureLotsSummary(expectedGroupId) {
    const element = document.getElementById(PDF_EXPORT_CONFIG.elements.lotsSummary)
    if (!element) {
      console.log('[PDF Export] Lots summary not found (single lot auction)')
      return null
    }

    // Verify the element has the correct group ID before capturing
    const elementGroupId = element.dataset?.groupId
    const verbose = PDF_EXPORT_CONFIG.verboseLogging

    if (verbose) {
      console.log(
        `[PDF Export] Lots summary data-group-id: ${elementGroupId || 'not set'}, expected: ${expectedGroupId}`
      )
    }

    if (expectedGroupId && elementGroupId !== expectedGroupId) {
      console.warn(
        `[PDF Export] Lots summary showing group ${elementGroupId || 'unknown'}, waiting for ${expectedGroupId}...`
      )
      // Wait for element to update with exponential backoff
      const { panelDatasetRetries, panelDatasetDelays } = PDF_EXPORT_CONFIG.navigation
      let summaryUpdated = false
      for (let attempt = 0; attempt < panelDatasetRetries; attempt++) {
        const delay =
          panelDatasetDelays[attempt] || panelDatasetDelays[panelDatasetDelays.length - 1]
        await new Promise((resolve) => setTimeout(resolve, delay))
        const currentGroupId = element.dataset?.groupId
        if (currentGroupId === expectedGroupId) {
          console.log(
            `[PDF Export] ✓ Lots summary updated to group ${expectedGroupId} after ${attempt + 1} attempts`
          )
          summaryUpdated = true
          break
        }
        if (verbose) {
          console.log(
            `[PDF Export] Lots summary still at group ${currentGroupId || 'unknown'}, attempt ${attempt + 1}/${panelDatasetRetries}`
          )
        }
      }
      if (!summaryUpdated) {
        console.warn(
          `[PDF Export] Lots summary did not update to group ${expectedGroupId}, capturing anyway`
        )
      }
    } else if (verbose) {
      console.log(`[PDF Export] ✓ Lots summary already showing correct group ${expectedGroupId}`)
    }

    const image = await captureById(PDF_EXPORT_CONFIG.elements.lotsSummary)
    if (image) {
      console.log('[PDF Export] Lots summary captured')
      return { data: image, title: 'Lots Summary' }
    }
    return null
  }

  /**
   * Capture basic info by switching to Terms tab
   */
  async function captureBasicInfo(originalTabIndex) {
    console.log('[PDF Export] Switching to Terms tab to capture basic info...')
    const switched = await ensureTabActive(1)

    if (!switched) {
      console.error('[PDF Export] Failed to switch to Terms tab for basic info capture')
      return null
    }

    const image = await captureElementWithRetry(PDF_EXPORT_CONFIG.elements.basicInfo, {
      maxRetries: PDF_EXPORT_CONFIG.navigation.basicInfoRetries,
      retryDelay: PDF_EXPORT_CONFIG.navigation.basicInfoRetryDelay,
      logPrefix: '[PDF Export]'
    })

    if (!Number.isInteger(originalTabIndex)) {
      originalTabIndex = 0
    }

    await ensureTabActive(originalTabIndex, { maxAttempts: 2 })

    if (image) {
      console.log('[PDF Export] Basic info captured')
      return { data: image, title: 'Basic Information' }
    }

    console.error('[PDF Export] Basic info element NOT FOUND')
    return null
  }

  /**
   * Fetch lot data for Lot Separator page only
   * @param {string} lotId - The lot/auction ID
   * @param {number} lotNumber - The lot number
   * @returns {Promise<object>} - Minimal lot data for separator page
   */
  async function fetchLotDataForPdf(lotId, lotNumber) {
    // Fetch lot name and supplies for lot separator
    const [auctionResult, suppliesResult] = await Promise.all([
      supabase.from('auctions').select('lot_name, name').eq('id', lotId).single(),
      supabase.from('supplies').select('name').eq('auction_id', lotId)
    ])

    const lotTitle = auctionResult.data?.lot_name || auctionResult.data?.name || 'Lot Title'
    const supplies = suppliesResult.data || []

    return {
      lotNumber: lotNumber,
      lotTitle: lotTitle,
      lineItems: supplies.map((supply, index) => ({
        code: `LI-${String(index + 1).padStart(2, '0')}`,
        description: supply.name || 'Item description',
        name: supply.name
      }))
    }
  }

  /**
   * Validate imageRefs array has correct structure and order
   * @param {Array} imageRefs - Array of image references
   * @param {Array} lots - Array of lot objects
   * @throws {Error} - If validation fails
   */
  function validateImageRefsOrder(imageRefs, lots) {
    const verbose = PDF_EXPORT_CONFIG.verboseLogging

    if (verbose) {
      console.log('[PDF Export] Validating imageRefs order...')
      console.log(`[PDF Export] Total refs: ${imageRefs.length}, Total lots: ${lots.length}`)
    }

    if (!imageRefs || imageRefs.length === 0) {
      throw new Error('No images captured for PDF export')
    }

    // Build expected sections per lot
    const expectedSectionsPerLot = [
      'Lot Separator',
      'Dashboard Part 1',
      'Dashboard Part 2',
      'Activity Log',
      'Lot Rules',
      'Pre-bid',
      'Terms'
    ]

    // Track which lots have which sections
    const lotSections = new Map()

    for (const ref of imageRefs) {
      if (!ref.title) continue

      // Extract lot number from title if present
      const lotMatch = ref.title.match(/Lot (\d+)/)
      if (lotMatch) {
        const lotNum = parseInt(lotMatch[1], 10)
        if (!lotSections.has(lotNum)) {
          lotSections.set(lotNum, new Set())
        }

        // Categorize the section
        for (const section of expectedSectionsPerLot) {
          if (ref.title.toLowerCase().includes(section.toLowerCase().replace(' ', ''))) {
            lotSections.get(lotNum).add(section)
            break
          }
          // Handle partial matches
          if (section === 'Dashboard Part 1' && ref.title.includes('Dashboard Part 1')) {
            lotSections.get(lotNum).add('Dashboard Part 1')
            break
          }
          if (section === 'Dashboard Part 2' && ref.title.includes('Dashboard Part 2')) {
            lotSections.get(lotNum).add('Dashboard Part 2')
            break
          }
          if (section === 'Activity Log' && ref.title.includes('Activity Log')) {
            lotSections.get(lotNum).add('Activity Log')
            break
          }
          if (section === 'Lot Separator' && ref.title === 'Lot Separator') {
            lotSections.get(lotNum).add('Lot Separator')
            break
          }
          if (section === 'Lot Rules' && ref.title.includes('Lot Rules')) {
            lotSections.get(lotNum).add('Lot Rules')
            break
          }
          if (section === 'Pre-bid' && ref.title.includes('Pre-bid')) {
            lotSections.get(lotNum).add('Pre-bid')
            break
          }
          if (section === 'Terms' && ref.title.includes('Terms & Conditions')) {
            lotSections.get(lotNum).add('Terms')
            break
          }
        }
      }
    }

    // Check each lot has critical sections
    const criticalSections = ['Lot Separator', 'Dashboard Part 1', 'Dashboard Part 2']
    const warnings = []

    for (const lot of lots) {
      const lotNum = lot.lot_number
      const sections = lotSections.get(lotNum)

      if (!sections) {
        throw new Error(
          `Lot ${lotNum} has no captured sections. This indicates a serious export failure.`
        )
      }

      for (const critical of criticalSections) {
        if (!sections.has(critical)) {
          warnings.push(`Lot ${lotNum} missing critical section: ${critical}`)
        }
      }
    }

    if (warnings.length > 0) {
      console.warn('[PDF Export] Validation warnings:')
      warnings.forEach((w) => console.warn(`  - ${w}`))

      // Don't fail for non-critical missing sections, but log them
      if (verbose) {
        console.log('[PDF Export] Captured sections per lot:')
        lotSections.forEach((sections, lotNum) => {
          console.log(`  Lot ${lotNum}: ${Array.from(sections).join(', ')}`)
        })
      }
    }

    // Verify order: sections for lot N should come before lot N+1
    let currentLotIndex = -1
    let lastSeenLotNum = 0

    for (const ref of imageRefs) {
      if (!ref.title) continue

      const lotMatch = ref.title.match(/Lot (\d+)/)
      if (lotMatch) {
        const lotNum = parseInt(lotMatch[1], 10)
        const lotIndex = lots.findIndex((l) => l.lot_number === lotNum)

        if (lotIndex < currentLotIndex) {
          throw new Error(
            `Image order violation: Found "Lot ${lotNum}" content after "Lot ${lastSeenLotNum}". ` +
              `This indicates lot data bleeding between captures.`
          )
        }

        if (lotIndex > currentLotIndex) {
          currentLotIndex = lotIndex
          lastSeenLotNum = lotNum
        }
      }
    }

    if (verbose) {
      console.log('[PDF Export] ✓ Image order validation passed')
    }
  }

  /**
   * Send image references to server for PDF generation
   * Images are stored in Supabase Storage, server will download them
   * @param {Array} imageRefs - Array of {storagePath, title, lotData?, lotContext?}
   * @param {Object} auctionData - Auction metadata
   * @param {string} exportSessionId - Export session ID for cleanup
   */
  async function generatePdfOnServer(imageRefs, auctionData, exportSessionId) {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      console.error('[PDF Export] No auth session found')
      throw new Error('Authentication required. Please log in again.')
    }

    const endpoint = PDF_EXPORT_CONFIG.export.apiEndpoint(auctionData.originalLotId)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageRefs, // Storage paths instead of base64 data
        exportSessionId,
        metadata: {
          auctionId: auctionData.originalLotId,
          exportDate: new Date().toISOString(),
          filename: PDF_EXPORT_CONFIG.export.filename(auctionData.auctionName, Date.now())
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PDF Export] PDF generation failed:', errorText)
      throw new Error(`Failed to generate PDF: ${errorText}`)
    }

    return response
  }

  /**
   * Download PDF from response
   */
  async function downloadPdf(response, filename) {
    const blob = await response.blob()
    exportProgress.value = t('pdfExport.downloading')

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    console.log('[PDF Export] PDF downloaded successfully')
  }

  /**
   * Main export function
   */
  async function exportPdf(input) {
    // If called from an event handler, ignore the event parameter
    // and use default options instead
    if (input instanceof Event || input?.target) {
      console.warn('[PDF Export] Called with Event object, using default options')
    }

    // Save original state
    const originalLotId = route.params.auctionId
    const groupId = route.params.auctionGroupId
    const originalTabIndex = Number.isInteger(tabsState.value) ? tabsState.value : 0

    // Get user ID for storage paths
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      alert('❌ PDF Export Failed\n\nAuthentication required. Please log in again.')
      return
    }
    const userId = user.id
    const exportSessionId = generateExportSessionId()
    const uploadedPaths = [] // Track uploaded files for cleanup on error

    // Freeze layout
    let unfreezeLayout = freezeLayoutForExport()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, PDF_EXPORT_CONFIG.layout.waitAfterFreeze))

    try {
      exportingPdf.value = true
      isExporting.value = true
      exportProgress.value = t('pdfExport.preparing')

      console.log('[PDF Export] Starting PDF export with frozen desktop layout')
      console.log('[PDF Export] Export session:', exportSessionId)
      console.log('[PDF Export] Original tab index:', originalTabIndex)

      const imageRefs = [] // Storage paths instead of base64 data
      let imageIndex = 0

      // Helper to upload and track an image
      const uploadImage = async (base64Data, title, extraData = {}) => {
        const filename = `${String(imageIndex++).padStart(3, '0')}-${title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
        const storagePath = await uploadImageToStorage(
          base64Data,
          userId,
          exportSessionId,
          filename
        )
        uploadedPaths.push(storagePath)
        return { storagePath, title, ...extraData }
      }

      // 1. Capture lots summary (if exists)
      console.log('[PDF Export] Step 1: Capturing lots summary...')
      // Refresh data before capturing to ensure lots summary is up-to-date
      clearAuctionMemoizeCache()
      try {
        await refreshNuxtData()
      } catch (e) {
        console.warn('[PDF Export] refreshNuxtData before lots summary failed:', e.message)
      }
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 300))
      const lotsSummary = await captureLotsSummary(groupId)

      // 2. Capture basic info from Terms tab
      console.log('[PDF Export] Step 2: Capturing basic info...')
      const basicInfo = await captureBasicInfo(originalTabIndex)

      const overviewSections = []
      if (lotsSummary?.data) {
        overviewSections.push(lotsSummary.data)
      }
      if (basicInfo?.data) {
        overviewSections.push(basicInfo.data)
      }

      if (overviewSections.length > 0) {
        let combinedOverviewImage = null
        if (overviewSections.length === 1) {
          combinedOverviewImage = overviewSections[0]
        } else {
          combinedOverviewImage = await combineImagesVertically(overviewSections, {
            spacing: 80,
            backgroundColor: '#ffffff'
          })
        }

        if (combinedOverviewImage) {
          let overviewTitle = 'Basic Information'
          if (overviewSections.length === 1 && lotsSummary && !basicInfo) {
            overviewTitle = lotsSummary.title || 'Lots Summary'
          } else if (overviewSections.length === 2 && lotsSummary && basicInfo) {
            overviewTitle = 'Lots Summary & Basic Information'
          } else if (basicInfo?.title) {
            overviewTitle = basicInfo.title
          }

          exportProgress.value = t('pdfExport.uploading') || 'Uploading images...'
          const ref = await uploadImage(combinedOverviewImage, overviewTitle)
          imageRefs.push(ref)
        } else {
          console.warn('[PDF Export] Failed to combine overview images')
        }
      }

      // 3. Fetch and prepare lots
      console.log('[PDF Export] Step 3: Fetching lots...')
      exportProgress.value = t('pdfExport.loadingLots')
      let lots = await fetchLots(groupId)
      console.log('[PDF Export] Fetched lots:', lots.length)

      if (lots.length === 0) {
        // Fallback to single lot from route
        lots = [
          {
            id: originalLotId,
            lot_number: 1,
            lot_name: 'Current Lot',
            name: 'Current Lot'
          }
        ]
      }

      lots = filterBreakLots(lots)
      console.log(`[PDF Export] Found ${lots.length} lot(s) to export`)

      // 4. Ensure we start from first lot
      await ensureFirstLot(lots, groupId)

      // Helper to get actual current lot ID from URL (route object may be stale during async loop)
      const getCurrentLotIdFromUrl = () => {
        const match = window.location.pathname.match(/\/lots\/([^/]+)\//)
        return match ? match[1] : null
      }

      // 5. Process each lot
      for (let i = 0; i < lots.length; i++) {
        const lot = lots[i]
        exportProgress.value = t('pdfExport.exportingLot', { current: i + 1, total: lots.length })
        console.log(`[PDF Export] Processing lot ${i + 1}/${lots.length}: ${lot.id}`)

        // Navigate to lot if needed - use URL instead of stale route object
        const currentLotId = getCurrentLotIdFromUrl()
        if (lot.id !== currentLotId) {
          console.log(
            `[PDF Export] URL shows lot ${currentLotId || 'unknown'}, need to navigate to ${lot.id}`
          )

          // Temporarily unfreeze layout to allow proper navigation
          unfreezeLayout()
          await nextTick()
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Force navigation to ensure we're on the correct lot (bypasses stale route checks)
          const navigationSuccess = await navigateToLot(groupId, lot.id, true, true)
          if (!navigationSuccess) {
            console.error(`[PDF Export] Failed to navigate to lot ${lot.id}, skipping this lot`)
            // Re-freeze before continuing
            unfreezeLayout = freezeLayoutForExport()
            await nextTick()
            continue
          }

          await waitForComponentLoad()

          // Force refresh of Nuxt data to get new lot data
          try {
            await refreshNuxtData()
          } catch (e) {
            console.warn('[PDF Export] refreshNuxtData failed:', e.message)
          }

          // Clear memoize caches again after refreshNuxtData to ensure fresh data
          // This is a safety net in addition to the cache clear in navigateToLot()
          clearAuctionMemoizeCache()

          // Force Vue to process updates
          await nextTick()

          // IMPROVED: Use adaptive verification instead of fixed delay
          // Wait for all critical panels to show correct lot ID
          const lotVerified = await verifyLotDataUpdated(lot.id)
          if (!lotVerified) {
            console.warn(
              `[PDF Export] Not all panels updated to lot ${lot.id}, but proceeding with capture. ` +
                `Individual panel captures will retry with exponential backoff.`
            )
          }

          // Additional short delay to ensure UI is stable
          await nextTick()
          await new Promise((resolve) => setTimeout(resolve, 300))

          // Re-freeze layout for capture
          unfreezeLayout = freezeLayoutForExport()
          await nextTick()
          await new Promise((resolve) =>
            setTimeout(resolve, PDF_EXPORT_CONFIG.layout.waitAfterFreeze)
          )

          // Use URL to log actual current lot (route object may be stale)
          const actualCurrentLot = getCurrentLotIdFromUrl()
          console.log(`[PDF Export] Navigation complete, now on lot ${actualCurrentLot}`)
        } else {
          console.log(`[PDF Export] URL confirms already on lot ${lot.id}, skipping navigation`)
        }

        // Switch to Dashboard tab (tab 0) where activity log & dashboard are visible
        console.log('[PDF Export] Switching to Dashboard tab to capture lot elements...')
        const dashboardTabReady = await ensureTabActive(0)
        if (!dashboardTabReady) {
          console.error(
            `[PDF Export] Unable to activate Dashboard tab for lot ${lot.id}, skipping lot`
          )
          continue
        }

        // Fetch lot data from Supabase (for server-generated pages)
        const lotData = await fetchLotDataForPdf(lot.id, lot.lot_number)
        const lotContext = `LOT ${lot.lot_number} - ${lot.lot_name || lot.name}`

        // Add Lot Separator page (server-generated, no image upload needed)
        console.log(`[PDF Export] Adding Lot Separator page for lot ${i + 1}...`)
        imageRefs.push({
          title: 'Lot Separator',
          lotData: lotData,
          storagePath: null // null = server will generate HTML
        })

        // 1. Capture Dashboard Part 1 (Timer + Pricing)
        const dashboardElement = document.getElementById(PDF_EXPORT_CONFIG.elements.dashboard)
        if (dashboardElement) {
          // CRITICAL: Verify dashboard has correct lot ID before capturing
          let dashboardLotId = dashboardElement.dataset?.auctionId
          const verbose = PDF_EXPORT_CONFIG.verboseLogging

          if (verbose) {
            console.log(
              `[PDF Export] Dashboard data-auction-id: ${dashboardLotId || 'not set'}, expected: ${lot.id}`
            )
          }

          if (dashboardLotId !== lot.id) {
            console.warn(
              `[PDF Export] Dashboard showing lot ${dashboardLotId || 'unknown'}, waiting for ${lot.id}...`
            )
            // Wait for dashboard to update with exponential backoff
            const { panelDatasetRetries, panelDatasetDelays } = PDF_EXPORT_CONFIG.navigation
            let dashboardUpdated = false
            for (let attempt = 0; attempt < panelDatasetRetries; attempt++) {
              const delay =
                panelDatasetDelays[attempt] || panelDatasetDelays[panelDatasetDelays.length - 1]
              await new Promise((resolve) => setTimeout(resolve, delay))
              dashboardLotId = dashboardElement.dataset?.auctionId
              if (dashboardLotId === lot.id) {
                console.log(
                  `[PDF Export] ✓ Dashboard updated to lot ${lot.id} after ${attempt + 1} attempts`
                )
                dashboardUpdated = true
                break
              }
              if (verbose) {
                console.log(
                  `[PDF Export] Dashboard still at lot ${dashboardLotId || 'unknown'}, attempt ${attempt + 1}/${panelDatasetRetries}`
                )
              }
            }
            if (!dashboardUpdated) {
              const finalLotId = dashboardElement.dataset?.auctionId || 'unknown'
              throw new Error(
                `Dashboard did not update to lot ${lot.id} after ${panelDatasetRetries} retries ` +
                  `(still showing lot ${finalLotId}). This would cause wrong lot data in PDF.`
              )
            }
          } else if (verbose) {
            console.log(`[PDF Export] ✓ Dashboard already showing correct lot ${lot.id}`)
          }

          // Hide activity log card before dashboard capture
          const activityLogCard = document.getElementById(PDF_EXPORT_CONFIG.elements.activityLog)
          const originalActivityLogDisplay = activityLogCard ? activityLogCard.style.display : ''
          if (activityLogCard) {
            activityLogCard.style.setProperty('display', 'none', 'important')
          }

          const dashboardPart1 = await captureDashboardPart1(dashboardElement)
          if (dashboardPart1) {
            exportProgress.value = t('pdfExport.uploading') || 'Uploading images...'
            const ref = await uploadImage(
              dashboardPart1,
              `Dashboard Part 1 - Lot ${lot.lot_number}`,
              { lotContext }
            )
            imageRefs.push(ref)
          }

          // 2. Capture Dashboard Part 2 (Leaderboard + Chart + Bid Table)
          const dashboardPart2 = await captureDashboardPart2(dashboardElement)
          if (dashboardPart2) {
            const ref = await uploadImage(
              dashboardPart2,
              `Dashboard Part 2 - Lot ${lot.lot_number}`,
              { lotContext }
            )
            imageRefs.push(ref)
          }

          // Restore activity log visibility
          if (activityLogCard) {
            if (originalActivityLogDisplay) {
              activityLogCard.style.display = originalActivityLogDisplay
            } else {
              activityLogCard.style.removeProperty('display')
            }
          }
        }

        // 3. Capture Activity Log
        const activityLogImages = await captureActivityLogWithPagination()
        for (let index = 0; index < activityLogImages.length; index++) {
          const img = activityLogImages[index]
          // Skip null/empty images
          if (img) {
            const ref = await uploadImage(
              img,
              `Activity Log - Lot ${lot.lot_number} - Page ${index + 1}`,
              { lotContext }
            )
            imageRefs.push(ref)
          }
        }

        // 4. Capture Lot Rules and Ceiling Prices (switch to tab 1 - Terms)
        console.log('[PDF Export] Switching to Terms tab (tab 1) for Lot Rules...')
        const lotRulesPanels = ['terms-rules-panel', 'terms-ceiling-panel']
        const lotRulesReady = await ensurePanelsVisibleInTab(lotRulesPanels, 1, 'Lot Rules', lot.id)
        let lotRulesImage = null
        if (lotRulesReady) {
          lotRulesImage = await combinePanels(lotRulesPanels, {
            expectedLotId: lot.id
          })
        }

        if (lotRulesImage) {
          console.log(
            '[PDF Export] Lot Rules captured:',
            Math.round(lotRulesImage.length / 1024),
            'KB'
          )
          const ref = await uploadImage(
            lotRulesImage,
            `Lot Rules and Ceiling Prices - Lot ${lot.lot_number}`,
            { lotContext }
          )
          imageRefs.push(ref)
        } else {
          const buttons = getTabButtons()
          console.warn(
            `[PDF Export] Lot Rules capture failed (tab state ${tabsState.value}, DOM active ${getDomActiveTabIndex(buttons)})`
          )
        }

        // 5. Capture Pre-bid & Terms Approval (switch to tab 2 - Status)
        console.log('[PDF Export] Switching to Status tab (tab 2) for Pre-bid & Terms Approval...')
        const prebidElement = await ensureElementVisibleInTab(
          'prebid-approval-capture',
          2,
          'Pre-bid & Terms Approval',
          { attempts: 3, retries: 5, delay: 500 },
          lot.id
        )

        if (prebidElement) {
          console.log(`[PDF Export] Capturing Pre-bid & Terms Approval for lot ${i + 1}...`)

          const prebidCanvas = await html2canvas(prebidElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
            allowTaint: true
          })

          const prebidPng = prebidCanvas.toDataURL('image/png')
          const prebidImage = await compressImage(prebidPng)
          console.log(
            '[PDF Export] Pre-bid & Terms Approval captured:',
            Math.round(prebidImage.length / 1024),
            'KB'
          )

          const ref = await uploadImage(
            prebidImage,
            `Pre-bid & Terms Approval - Lot ${lot.lot_number}`,
            { lotContext }
          )
          imageRefs.push(ref)
        } else {
          console.warn('[PDF Export] Pre-bid & Terms Approval element not found')
        }

        // 6. Capture Terms & Conditions (switch back to tab 1 - Terms)
        console.log('[PDF Export] Switching to Terms tab (tab 1) for Terms & Conditions...')
        const termsPanels = [
          'terms-awarding-panel',
          'terms-commercial-panel',
          'terms-general-panel'
        ]

        console.log(`[PDF Export] Capturing Terms & Conditions for lot ${i + 1}...`)
        const termsReady = await ensurePanelsVisibleInTab(
          termsPanels,
          1,
          'Terms & Conditions',
          lot.id
        )
        let termsImage = null
        if (termsReady) {
          termsImage = await combinePanels(termsPanels, {
            expectedLotId: lot.id
          })
        }

        if (termsImage) {
          console.log(
            '[PDF Export] Terms & Conditions captured:',
            Math.round(termsImage.length / 1024),
            'KB'
          )
          const ref = await uploadImage(termsImage, `Terms & Conditions - Lot ${lot.lot_number}`, {
            lotContext
          })
          imageRefs.push(ref)
        } else {
          const buttons = getTabButtons()
          console.warn(
            `[PDF Export] Terms & Conditions capture failed (tab state ${tabsState.value}, DOM active ${getDomActiveTabIndex(buttons)})`
          )
        }

        // Switch back to Dashboard tab
        await ensureTabActive(0, { maxAttempts: 2 })
      }

      // 7. Validate image order before sending to server
      console.log('[PDF Export] Step 7: Validating captured images...')
      try {
        validateImageRefsOrder(imageRefs, lots)
      } catch (validationError) {
        // Log detailed info for debugging
        console.error('[PDF Export] Validation failed:', validationError.message)
        console.error('[PDF Export] Captured imageRefs:')
        imageRefs.forEach((ref, idx) => {
          console.error(`  ${idx}: ${ref.title} (lot: ${ref.lotContext || 'N/A'})`)
        })
        throw validationError
      }

      // 8. Generate PDF on server (server will download images from storage)
      console.log('[PDF Export] Step 8: Generating PDF on server...')
      exportProgress.value = t('pdfExport.generating')
      console.log(`[PDF Export] Sending ${imageRefs.length} image reference(s) to server...`)
      console.log(`[PDF Export] Total uploaded: ${uploadedPaths.length} files`)

      const response = await generatePdfOnServer(
        imageRefs,
        {
          originalLotId,
          auctionName: lots[0]?.name || 'auction'
        },
        exportSessionId
      )
      console.log('[PDF Export] Server responded successfully')
      // Note: Server handles cleanup of temp images after PDF generation

      // 9. Download PDF
      console.log('[PDF Export] Step 9: Downloading PDF...')
      const filename = PDF_EXPORT_CONFIG.export.filename(lots[0]?.name || 'auction', Date.now())
      await downloadPdf(response, filename)

      exportProgress.value = t('pdfExport.success')
      console.log('[PDF Export] ✅ Export completed successfully!')

      // Navigate back to original lot
      if (route.params.auctionId !== originalLotId) {
        console.log('[PDF Export] Navigating back to original lot...')
        await navigateTo(`/auctions/${groupId}/lots/${originalLotId}/buyer`, { replace: true })
      }

      // Restore original tab
      console.log('[PDF Export] Restoring original tab...')
      await ensureTabActive(originalTabIndex, { maxAttempts: 2 })
    } catch (error) {
      console.error('[PDF Export] Export error:', error)

      // Cleanup uploaded images on error (client-side cleanup as fallback)
      if (uploadedPaths.length > 0) {
        console.log('[PDF Export] Cleaning up uploaded images after error...')
        await cleanupUploadedImages(uploadedPaths)
      }

      // Better error message handling
      let errorMessage = 'An unknown error occurred during PDF export'

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.statusMessage) {
        errorMessage = error.statusMessage
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error instanceof Event) {
        // This shouldn't happen anymore, but just in case
        errorMessage = 'Invalid function call - Event object passed as error'
        console.error('[PDF Export] Event object caught as error. This is a bug.')
      }

      alert(
        `❌ PDF Export Failed\n\n${errorMessage}\n\nPlease try again or contact support if the problem persists.`
      )
      await ensureTabActive(originalTabIndex, { maxAttempts: 2 })
    } finally {
      unfreezeLayout()
      console.log('[PDF Export] Layout restored')

      setTimeout(() => {
        exportingPdf.value = false
        isExporting.value = false
        exportProgress.value = ''
      }, 1000)
    }
  }

  return {
    exportPdf,
    exportingPdf,
    exportProgress,
    isExporting
  }
}
