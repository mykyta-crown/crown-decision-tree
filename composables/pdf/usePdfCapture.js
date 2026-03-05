/**
 * PDF Capture Composable
 * Handles screenshot capture with html2canvas, image compression, and element targeting
 */

import html2canvas from 'html2canvas'
import { PDF_EXPORT_CONFIG } from './config'

export const usePdfCapture = () => {
  /**
   * Compress image from PNG to JPEG to reduce file size
   * @param {string} base64 - Base64 encoded PNG image
   * @param {number} quality - JPEG quality (0-1), default from config
   * @returns {Promise<string>} - Compressed base64 JPEG image
   */
  async function compressImage(base64, quality = PDF_EXPORT_CONFIG.capture.quality) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          // Check if image has valid dimensions
          if (img.width === 0 || img.height === 0) {
            reject(new Error('Image has invalid dimensions (0x0)'))
            return
          }

          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = PDF_EXPORT_CONFIG.capture.backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0)
          const compressed = canvas.toDataURL('image/jpeg', quality)
          resolve(compressed)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = (event) => {
        // Reject with a proper Error, not the Event object
        reject(new Error('Failed to load image for compression'))
      }
      img.src = base64
    })
  }

  /**
   * Capture element with retries and validation
   * @param {string} elementId - DOM element ID to capture
   * @param {object} options - Capture options
   * @returns {Promise<string|null>} - Compressed image data or null if not found
   */
  async function captureElementWithRetry(elementId, options = {}) {
    const {
      maxRetries = PDF_EXPORT_CONFIG.navigation.basicInfoRetries,
      retryDelay = PDF_EXPORT_CONFIG.navigation.basicInfoRetryDelay,
      logPrefix = '[PDF Capture]'
    } = options

    let element = null
    let retries = 0

    while (!element && retries < maxRetries) {
      element = document.getElementById(elementId)
      if (element && element.offsetHeight > 0) {
        console.log(`${logPrefix} Element "${elementId}" found on attempt ${retries + 1}`)
        break
      }
      console.log(`${logPrefix} Waiting for element "${elementId}"... attempt ${retries + 1}`)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      retries++
    }

    if (!element || element.offsetHeight === 0) {
      console.error(`${logPrefix} Element "${elementId}" NOT FOUND after ${maxRetries} retries`)
      return null
    }

    return await captureElement(element, elementId)
  }

  /**
   * Capture a single DOM element as an image
   * @param {HTMLElement} element - Element to capture
   * @param {string} elementId - Element ID for logging
   * @returns {Promise<string|null>} - Compressed image data or null if element is empty
   */
  async function captureElement(element, elementId = 'unknown') {
    console.log(
      `[PDF Capture] Capturing element "${elementId}" (${element.offsetWidth}x${element.offsetHeight})`
    )

    // Skip elements with zero dimensions
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      console.warn(
        `[PDF Capture] Skipping element "${elementId}" - has zero dimensions (${element.offsetWidth}x${element.offsetHeight})`
      )
      return null
    }

    const canvas = await html2canvas(element, {
      scale: PDF_EXPORT_CONFIG.capture.scale,
      backgroundColor: PDF_EXPORT_CONFIG.capture.backgroundColor,
      logging: PDF_EXPORT_CONFIG.capture.logging,
      useCORS: PDF_EXPORT_CONFIG.capture.useCORS,
      allowTaint: PDF_EXPORT_CONFIG.capture.allowTaint
    })

    const pngData = canvas.toDataURL('image/png')
    console.log(`[PDF Capture] Captured (PNG): ${Math.round(pngData.length / 1024)} KB`)

    const compressedData = await compressImage(pngData)
    console.log(`[PDF Capture] Compressed (JPEG): ${Math.round(compressedData.length / 1024)} KB`)

    return compressedData
  }

  /**
   * Capture element by ID with optional pagination support
   * @param {string} elementId - DOM element ID
   * @param {object} options - Additional options
   * @returns {Promise<string|null>} - Compressed image or null
   */
  async function captureById(elementId, options = {}) {
    const element = document.getElementById(elementId)

    if (!element) {
      console.warn(`[PDF Capture] Element "${elementId}" not found`)
      return null
    }

    if (element.offsetHeight === 0) {
      console.warn(`[PDF Capture] Element "${elementId}" has zero height`)
      return null
    }

    return await captureElement(element, elementId)
  }

  /**
   * Wait for element height to stabilize (no changes for threshold period)
   * @param {HTMLElement} element - Element to monitor
   * @param {object} options - Stability options
   * @returns {Promise<void>}
   */
  async function waitForHeightStability(element, options = {}) {
    const { interval = 100, threshold = 200, maxWait = 2000 } = options

    if (!element) return

    const startTime = Date.now()
    let lastHeight = 0
    let stableStart = null

    while (Date.now() - startTime < maxWait) {
      const currentHeight = element.offsetHeight

      if (currentHeight === lastHeight) {
        if (!stableStart) {
          stableStart = Date.now()
        } else if (Date.now() - stableStart >= threshold) {
          return // Stable
        }
      } else {
        stableStart = null
        lastHeight = currentHeight
      }

      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  /**
   * Disable CSS transitions on an element and its children
   * @param {HTMLElement} element - Element to disable transitions on
   * @returns {function} - Cleanup function to restore transitions
   */
  function disableCssTransitions(element) {
    if (!element) return () => {}

    const styleId = 'pdf-capture-no-transitions'
    let style = document.getElementById(styleId)

    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .pdf-capture-no-transitions,
        .pdf-capture-no-transitions * {
          transition: none !important;
          animation: none !important;
        }
      `
      document.head.appendChild(style)
    }

    element.classList.add('pdf-capture-no-transitions')

    return () => {
      element.classList.remove('pdf-capture-no-transitions')
      // Remove style if no more elements use it
      if (!document.querySelector('.pdf-capture-no-transitions')) {
        style?.remove()
      }
    }
  }

  /**
   * Capture activity log with dynamic pagination
   * Handles showing/hiding pagination to capture all pages
   */
  async function captureActivityLogWithPagination() {
    const logElement = document.getElementById(PDF_EXPORT_CONFIG.elements.activityLog)
    if (!logElement) {
      console.log('[PDF Capture] Activity log element not found')
      return []
    }

    if (logElement.offsetWidth === 0 || logElement.offsetHeight === 0) {
      console.warn('[PDF Capture] Activity log element has zero dimensions, skipping')
      return []
    }

    const images = []
    const scrollableTable = logElement.querySelector('.scrollbar-custom')
    const cardContainer = logElement.querySelector('.max-card-height')
    const tbody = logElement.querySelector('tbody')

    if (!tbody) {
      console.warn('[PDF Capture] Activity log tbody not found')
      return images
    }

    // IMPROVED: Disable CSS transitions during capture for instant DOM updates
    const restoreTransitions = disableCssTransitions(logElement)

    const originalScrollableStyles = scrollableTable
      ? {
          maxHeight: scrollableTable.style.maxHeight || '',
          overflowY: scrollableTable.style.overflowY || '',
          overflow: scrollableTable.style.overflow || ''
        }
      : null

    const originalCardStyles = cardContainer
      ? {
          maxHeight: cardContainer.style.maxHeight || ''
        }
      : null

    if (scrollableTable) {
      scrollableTable.style.setProperty('max-height', 'none', 'important')
      scrollableTable.style.setProperty('overflow-y', 'visible', 'important')
      scrollableTable.style.setProperty('overflow', 'visible', 'important')
    }

    if (cardContainer) {
      cardContainer.style.setProperty('max-height', 'none', 'important')
    }

    try {
      await nextTick()
      // IMPROVED: Wait for height to stabilize instead of fixed delay
      await waitForHeightStability(logElement, { interval: 100, threshold: 150, maxWait: 1500 })

      const allRows = Array.from(tbody.querySelectorAll('tr'))
      console.log('[PDF Capture] Total activity log entries:', allRows.length)

      const ROWS_PER_PAGE = 25

      if (allRows.length <= ROWS_PER_PAGE) {
        console.log('[PDF Capture] Activity log fits on one page')
        const activityLogCanvas = await html2canvas(logElement, {
          scale: PDF_EXPORT_CONFIG.capture.scale,
          backgroundColor: PDF_EXPORT_CONFIG.capture.backgroundColor,
          logging: PDF_EXPORT_CONFIG.capture.logging,
          useCORS: PDF_EXPORT_CONFIG.capture.useCORS,
          allowTaint: PDF_EXPORT_CONFIG.capture.allowTaint
        })

        const activityLogPng = activityLogCanvas.toDataURL('image/png')
        const activityLogImage = await compressImage(activityLogPng)
        console.log(
          '[PDF Capture] Activity log captured (single page):',
          Math.round(activityLogImage.length / 1024),
          'KB'
        )
        images.push(activityLogImage)
      } else {
        console.log('[PDF Capture] Activity log requires pagination')

        const capturedChunks = []
        let chunkNumber = 1

        for (let startIdx = 0; startIdx < allRows.length; startIdx += ROWS_PER_PAGE) {
          const endIdx = Math.min(startIdx + ROWS_PER_PAGE, allRows.length)
          console.log(
            `[PDF Capture] Capturing chunk ${chunkNumber}: rows ${startIdx + 1}-${endIdx} of ${allRows.length}`
          )

          allRows.forEach((row) => {
            row.style.setProperty('display', 'none', 'important')
          })

          for (let i = startIdx; i < endIdx; i++) {
            allRows[i].style.setProperty('display', 'table-row', 'important')
          }

          await nextTick()
          // IMPROVED: Wait for table height to stabilize instead of fixed 300ms delay
          await waitForHeightStability(logElement, { interval: 50, threshold: 100, maxWait: 1000 })

          const chunkCanvas = await html2canvas(logElement, {
            scale: PDF_EXPORT_CONFIG.capture.scale,
            backgroundColor: PDF_EXPORT_CONFIG.capture.backgroundColor,
            logging: PDF_EXPORT_CONFIG.capture.logging,
            useCORS: PDF_EXPORT_CONFIG.capture.useCORS,
            allowTaint: PDF_EXPORT_CONFIG.capture.allowTaint,
            onclone: (clonedDoc) => {
              const selector = `#${PDF_EXPORT_CONFIG.elements.activityLog} tbody tr`
              const clonedRows = clonedDoc.querySelectorAll(selector)
              clonedRows.forEach((row, idx) => {
                if (idx < startIdx || idx >= endIdx) {
                  row.style.display = 'none'
                } else {
                  row.style.display = 'table-row'
                }
              })
            }
          })

          capturedChunks.push(chunkCanvas)
          console.log(`[PDF Capture] Chunk ${chunkNumber} captured`)
          chunkNumber++
        }

        allRows.forEach((row) => {
          row.style.removeProperty('display')
        })

        console.log(
          `[PDF Capture] Combining ${capturedChunks.length} chunks into side-by-side pages`
        )

        for (let i = 0; i < capturedChunks.length; i += 2) {
          const leftChunk = capturedChunks[i]
          const rightChunk = capturedChunks[i + 1]

          if (rightChunk) {
            const combinedCanvas = document.createElement('canvas')
            const ctx = combinedCanvas.getContext('2d')

            const gap = 200
            const maxHeight = Math.max(leftChunk.height, rightChunk.height)
            const totalWidth = leftChunk.width + rightChunk.width + gap

            combinedCanvas.width = totalWidth
            combinedCanvas.height = maxHeight

            ctx.fillStyle = PDF_EXPORT_CONFIG.capture.backgroundColor
            ctx.fillRect(0, 0, totalWidth, maxHeight)

            ctx.drawImage(leftChunk, 0, 0)

            const separatorX = leftChunk.width + Math.floor(gap / 2)
            ctx.strokeStyle = '#D0D0D0'
            ctx.lineWidth = 1
            ctx.setLineDash([5, 5])
            ctx.beginPath()
            ctx.moveTo(separatorX, 30)
            ctx.lineTo(separatorX, maxHeight - 30)
            ctx.stroke()
            ctx.setLineDash([])

            ctx.drawImage(rightChunk, leftChunk.width + gap, 0)

            const combinedPng = combinedCanvas.toDataURL('image/png')
            const combinedImage = await compressImage(combinedPng)
            console.log(
              `[PDF Capture] Combined page ${Math.floor(i / 2) + 1} captured:`,
              Math.round(combinedImage.length / 1024),
              'KB'
            )
            images.push(combinedImage)
          } else {
            const singlePng = leftChunk.toDataURL('image/png')
            const singleImage = await compressImage(singlePng)
            console.log(
              '[PDF Capture] Single page captured:',
              Math.round(singleImage.length / 1024),
              'KB'
            )
            images.push(singleImage)
          }
        }
      }
    } finally {
      // Restore CSS transitions
      restoreTransitions()

      if (scrollableTable) {
        if (originalScrollableStyles.maxHeight) {
          scrollableTable.style.maxHeight = originalScrollableStyles.maxHeight
        } else {
          scrollableTable.style.removeProperty('max-height')
        }

        if (originalScrollableStyles.overflowY) {
          scrollableTable.style.overflowY = originalScrollableStyles.overflowY
        } else {
          scrollableTable.style.removeProperty('overflow-y')
        }

        if (originalScrollableStyles.overflow) {
          scrollableTable.style.overflow = originalScrollableStyles.overflow
        } else {
          scrollableTable.style.removeProperty('overflow')
        }
      }

      if (cardContainer) {
        if (originalCardStyles.maxHeight) {
          cardContainer.style.maxHeight = originalCardStyles.maxHeight
        } else {
          cardContainer.style.removeProperty('max-height')
        }
      }
    }

    return images
  }

  /**
   * Remove margins and padding from element for clean capture
   * @param {HTMLElement} element - Element to modify
   * @returns {object} - Original styles for restoration
   */
  function removeMargins(element) {
    const originalStyles = {
      padding: element.style.padding || '',
      paddingLeft: element.style.paddingLeft || '',
      paddingRight: element.style.paddingRight || '',
      margin: element.style.margin || '',
      marginLeft: element.style.marginLeft || '',
      marginRight: element.style.marginRight || ''
    }

    element.style.setProperty('padding', '0', 'important')
    element.style.setProperty('margin', '0', 'important')

    const containers = element.querySelectorAll('.v-container')
    const cols = element.querySelectorAll('.v-col')

    const containerStyles = []
    containers.forEach((c) => {
      containerStyles.push({
        element: c,
        padding: c.style.padding || '',
        margin: c.style.margin || ''
      })
      c.style.setProperty('padding', '0', 'important')
      c.style.setProperty('margin', '0', 'important')
    })

    const colStyles = []
    cols.forEach((c) => {
      colStyles.push({
        element: c,
        padding: c.style.padding || '',
        paddingLeft: c.style.paddingLeft || '',
        paddingRight: c.style.paddingRight || ''
      })
      c.style.setProperty('padding-left', '4px', 'important')
      c.style.setProperty('padding-right', '4px', 'important')
    })

    return { originalStyles, containerStyles, colStyles }
  }

  /**
   * Restore original margins and padding
   * @param {HTMLElement} element - Element to restore
   * @param {object} styles - Original styles from removeMargins
   */
  function restoreMargins(element, { originalStyles, containerStyles, colStyles }) {
    Object.keys(originalStyles).forEach((key) => {
      if (originalStyles[key]) {
        element.style[key] = originalStyles[key]
      } else {
        element.style.removeProperty(key.replace(/([A-Z])/g, '-$1').toLowerCase())
      }
    })

    containerStyles.forEach(({ element: c, padding, margin }) => {
      if (padding) c.style.padding = padding
      else c.style.removeProperty('padding')
      if (margin) c.style.margin = margin
      else c.style.removeProperty('margin')
    })

    colStyles.forEach(({ element: c, padding, paddingLeft, paddingRight }) => {
      if (padding) c.style.padding = padding
      else c.style.removeProperty('padding')
      if (paddingLeft) c.style.paddingLeft = paddingLeft
      else c.style.removeProperty('padding-left')
      if (paddingRight) c.style.paddingRight = paddingRight
      else c.style.removeProperty('padding-right')
    })
  }

  /**
   * Combine Dashboard Part 1 canvases side by side
   * @param {HTMLCanvasElement} timerCanvas - Timer canvas
   * @param {HTMLCanvasElement} pricingTotalCanvas - Total price canvas
   * @param {HTMLCanvasElement} pricingPerUnitCanvas - Price per unit canvas (optional)
   * @returns {Promise<string>} - Compressed combined image
   */
  async function combineDashboardPart1(timerCanvas, pricingTotalCanvas, pricingPerUnitCanvas) {
    const combinedCanvas = document.createElement('canvas')
    const ctx = combinedCanvas.getContext('2d')

    const gap = 20
    let totalWidth = timerCanvas.width + pricingTotalCanvas.width + gap

    if (pricingPerUnitCanvas) {
      totalWidth += pricingPerUnitCanvas.width + gap
    }

    const maxHeight = Math.max(
      timerCanvas.height,
      pricingTotalCanvas.height,
      pricingPerUnitCanvas ? pricingPerUnitCanvas.height : 0
    )

    combinedCanvas.width = totalWidth
    combinedCanvas.height = maxHeight

    // Fill background
    ctx.fillStyle = PDF_EXPORT_CONFIG.capture.backgroundColor
    ctx.fillRect(0, 0, totalWidth, maxHeight)

    // Draw timer (left)
    ctx.drawImage(timerCanvas, 0, 0)

    // Draw total price (middle)
    ctx.drawImage(pricingTotalCanvas, timerCanvas.width + gap, 0)

    // Draw price per unit (right, if exists)
    if (pricingPerUnitCanvas) {
      ctx.drawImage(pricingPerUnitCanvas, timerCanvas.width + pricingTotalCanvas.width + gap * 2, 0)
    }

    const pngData = combinedCanvas.toDataURL('image/png')
    console.log(
      '[PDF Capture] Dashboard Part 1 combined (PNG):',
      Math.round(pngData.length / 1024),
      'KB'
    )

    const compressedData = await compressImage(pngData)
    console.log(
      '[PDF Capture] Dashboard Part 1 compressed (JPEG):',
      Math.round(compressedData.length / 1024),
      'KB'
    )

    return compressedData
  }

  /**
   * Combine Dashboard Part 2 canvases vertically
   * @param {HTMLCanvasElement} leaderboardCanvas - Leaderboard + chart canvas
   * @param {HTMLCanvasElement} bidTableCanvas - Bid table canvas (optional, for English auctions)
   * @returns {Promise<string>} - Compressed combined image
   */
  async function combineDashboardPart2(leaderboardCanvas, bidTableCanvas) {
    if (!bidTableCanvas) {
      // No bid table, just return leaderboard
      const pngData = leaderboardCanvas.toDataURL('image/png')
      return await compressImage(pngData)
    }

    const combinedCanvas = document.createElement('canvas')
    const ctx = combinedCanvas.getContext('2d')

    const gap = 20
    const totalWidth = Math.max(leaderboardCanvas.width, bidTableCanvas.width)
    const totalHeight = leaderboardCanvas.height + bidTableCanvas.height + gap

    combinedCanvas.width = totalWidth
    combinedCanvas.height = totalHeight

    // Fill background
    ctx.fillStyle = PDF_EXPORT_CONFIG.capture.backgroundColor
    ctx.fillRect(0, 0, totalWidth, totalHeight)

    // Draw leaderboard (top)
    ctx.drawImage(leaderboardCanvas, 0, 0)

    // Draw bid table (bottom)
    ctx.drawImage(bidTableCanvas, 0, leaderboardCanvas.height + gap)

    const pngData = combinedCanvas.toDataURL('image/png')
    console.log(
      '[PDF Capture] Dashboard Part 2 combined (PNG):',
      Math.round(pngData.length / 1024),
      'KB'
    )

    const compressedData = await compressImage(pngData)
    console.log(
      '[PDF Capture] Dashboard Part 2 compressed (JPEG):',
      Math.round(compressedData.length / 1024),
      'KB'
    )

    return compressedData
  }

  /**
   * Capture Dashboard Part 1: Timer + Pricing Cards
   * Includes both Total Price and Price Per Unit modes for Dutch/Japanese
   * @param {HTMLElement} dashboardElement - Dashboard container element
   * @returns {Promise<string|null>} - Compressed combined image or null
   */
  async function captureDashboardPart1(dashboardElement) {
    console.log('[PDF Capture] Capturing Dashboard Part 1 (Timer + Pricing)...')

    // Get first row (Timer + Pricing + Activity Log columns)
    const allRows = Array.from(dashboardElement.children).filter((el) => el.tagName === 'DIV')
    const firstRow = allRows[0]

    if (!firstRow) {
      console.warn('[PDF Capture] Dashboard first row not found')
      return null
    }

    const firstRowCols = Array.from(firstRow.children).filter((el) => el.tagName === 'DIV')
    console.log(`[PDF Capture] Found ${firstRowCols.length} columns in first row`)

    const timerCol = firstRowCols[0]
    const pricingCol = firstRowCols[1]

    if (!timerCol || !pricingCol) {
      console.warn('[PDF Capture] Timer or Pricing column not found')
      return null
    }

    try {
      // 1. CAPTURE TIMER
      console.log('[PDF Capture] Capturing Timer...')
      const timerStyles = removeMargins(timerCol)

      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 150))

      const timerCanvas = await html2canvas(timerCol, {
        scale: PDF_EXPORT_CONFIG.capture.scale,
        backgroundColor: PDF_EXPORT_CONFIG.capture.backgroundColor,
        logging: PDF_EXPORT_CONFIG.capture.logging,
        useCORS: PDF_EXPORT_CONFIG.capture.useCORS,
        allowTaint: PDF_EXPORT_CONFIG.capture.allowTaint
      })
      console.log('[PDF Capture] Timer captured:', timerCanvas.width, 'x', timerCanvas.height)

      restoreMargins(timerCol, timerStyles)

      // 2. CAPTURE PRICING CARDS - TOTAL PRICE MODE
      console.log('[PDF Capture] Capturing Pricing Cards - Total Price mode')
      const pricingStyles = removeMargins(pricingCol)

      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 150))

      const pricingTotalCanvas = await html2canvas(pricingCol, {
        scale: PDF_EXPORT_CONFIG.capture.scale,
        backgroundColor: PDF_EXPORT_CONFIG.capture.backgroundColor,
        logging: PDF_EXPORT_CONFIG.capture.logging,
        useCORS: PDF_EXPORT_CONFIG.capture.useCORS,
        allowTaint: PDF_EXPORT_CONFIG.capture.allowTaint
      })
      console.log(
        '[PDF Capture] Pricing Total captured:',
        pricingTotalCanvas.width,
        'x',
        pricingTotalCanvas.height
      )

      // 3. CAPTURE PRICING CARDS - PRICE PER UNIT MODE (only for Dutch/Japanese)
      let pricingPerUnitCanvas = null
      const toggleButton = firstRow.querySelector('.v-btn-group .v-btn')

      if (toggleButton) {
        // Dutch/Japanese: has Price Per Unit toggle
        console.log('[PDF Capture] Price Per Unit toggle found, capturing second pricing view...')
        toggleButton.click()

        // Wait for the display to update
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 150))

        console.log('[PDF Capture] Capturing Pricing Cards - Price Per Unit mode')
        pricingPerUnitCanvas = await html2canvas(pricingCol, {
          scale: PDF_EXPORT_CONFIG.capture.scale,
          backgroundColor: PDF_EXPORT_CONFIG.capture.backgroundColor,
          logging: PDF_EXPORT_CONFIG.capture.logging,
          useCORS: PDF_EXPORT_CONFIG.capture.useCORS,
          allowTaint: PDF_EXPORT_CONFIG.capture.allowTaint
        })
        console.log(
          '[PDF Capture] Pricing Per Unit captured:',
          pricingPerUnitCanvas.width,
          'x',
          pricingPerUnitCanvas.height
        )

        // Toggle back
        toggleButton.click()
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 150))
        console.log('[PDF Capture] Toggled back to Total Price view')
      } else {
        console.log('[PDF Capture] No Price Per Unit toggle found (English auction)')
      }

      restoreMargins(pricingCol, pricingStyles)

      // Combine Timer + Pricing(s) side by side
      return await combineDashboardPart1(timerCanvas, pricingTotalCanvas, pricingPerUnitCanvas)
    } catch (error) {
      console.error('[PDF Capture] Error capturing Dashboard Part 1:', error)
      return null
    }
  }

  /**
   * Capture Dashboard Part 2: Leaderboard + Chart + Bid Table
   * @param {HTMLElement} dashboardElement - Dashboard container element
   * @returns {Promise<string|null>} - Compressed combined image or null
   */
  async function captureDashboardPart2(dashboardElement) {
    console.log('[PDF Capture] Capturing Dashboard Part 2 (Leaderboard + Chart)...')

    const allRows = Array.from(dashboardElement.children).filter((el) => el.tagName === 'DIV')
    const secondRow = allRows[1] // Leaderboard + Chart
    const thirdRow = allRows[2] // Bid Table (English only)

    if (!secondRow) {
      console.warn('[PDF Capture] Dashboard second row not found')
      return null
    }

    try {
      // Capture second row (Leaderboard + Chart)
      console.log('[PDF Capture] Capturing second row (Leaderboard + Chart)...')
      const secondRowStyles = removeMargins(secondRow)

      // Expand leaderboard to show all suppliers
      const leaderboardTable = secondRow.querySelector('.leaders-table-max-height')
      const leaderboardCard = secondRow.querySelector('.card-height')
      const leaderboardCardText = secondRow.querySelector('.v-card-text')
      const vTableWrapper = secondRow.querySelector('.v-table__wrapper')
      const vTable = secondRow.querySelector('.v-table')
      const originalTableMaxHeight = leaderboardTable ? leaderboardTable.style.maxHeight : null
      const originalCardMaxHeight = leaderboardCard ? leaderboardCard.style.maxHeight : null
      const originalCardTextHeight = leaderboardCardText
        ? leaderboardCardText.style.maxHeight
        : null
      const originalWrapperMaxHeight = vTableWrapper ? vTableWrapper.style.maxHeight : null
      const originalWrapperOverflow = vTableWrapper
        ? vTableWrapper.style.overflowY || vTableWrapper.style.overflow
        : null
      const originalVTableHeight = vTable ? vTable.style.height : null

      if (leaderboardTable) {
        // Override max-height/overflow so the internal table can grow fully
        leaderboardTable.style.setProperty('max-height', 'none')
        leaderboardTable.style.setProperty('overflow', 'visible')
        console.log('[PDF Capture] Expanded leaderboard table to show all suppliers')
      }
      if (leaderboardCard) {
        // Important: original CSS uses max-height: 300px !important;
        // We must override with an inline !important to allow full expansion for the snapshot.
        leaderboardCard.style.setProperty('max-height', 'none', 'important')
        console.log('[PDF Capture] Expanded leaderboard card to show all suppliers')
      }
      if (leaderboardCardText) {
        leaderboardCardText.style.maxHeight = 'none'
        leaderboardCardText.style.overflow = 'visible'
      }
      if (vTableWrapper) {
        vTableWrapper.style.maxHeight = 'none'
        vTableWrapper.style.overflow = 'visible'
      }
      if (vTable) {
        vTable.style.height = 'auto'
      }

      // Also remove scrollbar restrictions
      const scrollbarCustom = secondRow.querySelector('.scrollbar-custom')
      if (scrollbarCustom) {
        scrollbarCustom.style.maxHeight = 'none'
        scrollbarCustom.style.overflow = 'visible'
      }

      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 500))

      const secondRowCanvas = await html2canvas(secondRow, {
        scale: PDF_EXPORT_CONFIG.capture.scale,
        backgroundColor: PDF_EXPORT_CONFIG.capture.backgroundColor,
        logging: PDF_EXPORT_CONFIG.capture.logging,
        useCORS: PDF_EXPORT_CONFIG.capture.useCORS,
        allowTaint: PDF_EXPORT_CONFIG.capture.allowTaint
      })
      console.log(
        '[PDF Capture] Second row captured:',
        secondRowCanvas.width,
        'x',
        secondRowCanvas.height
      )

      // Restore original styles
      if (leaderboardTable) {
        if (originalTableMaxHeight) {
          leaderboardTable.style.maxHeight = originalTableMaxHeight
        } else {
          leaderboardTable.style.removeProperty('max-height')
        }
        leaderboardTable.style.removeProperty('overflow')
      }
      if (leaderboardCard) {
        if (originalCardMaxHeight) {
          leaderboardCard.style.setProperty('max-height', originalCardMaxHeight, 'important')
        } else {
          leaderboardCard.style.removeProperty('max-height')
        }
      }
      if (leaderboardCardText) {
        if (originalCardTextHeight) {
          leaderboardCardText.style.maxHeight = originalCardTextHeight
        } else {
          leaderboardCardText.style.removeProperty('max-height')
        }
        leaderboardCardText.style.removeProperty('overflow')
      }
      if (vTableWrapper) {
        if (originalWrapperMaxHeight) {
          vTableWrapper.style.maxHeight = originalWrapperMaxHeight
        } else {
          vTableWrapper.style.removeProperty('max-height')
        }
        if (originalWrapperOverflow) {
          vTableWrapper.style.overflow = originalWrapperOverflow
        } else {
          vTableWrapper.style.removeProperty('overflow')
          vTableWrapper.style.removeProperty('overflow-y')
        }
      }
      if (vTable) {
        if (originalVTableHeight) {
          vTable.style.height = originalVTableHeight
        } else {
          vTable.style.removeProperty('height')
        }
      }
      if (scrollbarCustom) {
        scrollbarCustom.style.removeProperty('max-height')
        scrollbarCustom.style.removeProperty('overflow')
      }

      restoreMargins(secondRow, secondRowStyles)

      // Capture third row if exists (Bid Table for English auctions)
      let thirdRowCanvas = null
      if (thirdRow && thirdRow.offsetHeight > 0) {
        console.log('[PDF Capture] Capturing third row (Bid Table)...')
        const thirdRowStyles = removeMargins(thirdRow)

        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 150))

        thirdRowCanvas = await html2canvas(thirdRow, {
          scale: PDF_EXPORT_CONFIG.capture.scale,
          backgroundColor: PDF_EXPORT_CONFIG.capture.backgroundColor,
          logging: PDF_EXPORT_CONFIG.capture.logging,
          useCORS: PDF_EXPORT_CONFIG.capture.useCORS,
          allowTaint: PDF_EXPORT_CONFIG.capture.allowTaint
        })
        console.log(
          '[PDF Capture] Third row captured:',
          thirdRowCanvas.width,
          'x',
          thirdRowCanvas.height
        )

        restoreMargins(thirdRow, thirdRowStyles)
      } else {
        console.log('[PDF Capture] No third row found or has zero height')
      }

      // Combine vertically if both exist
      return await combineDashboardPart2(secondRowCanvas, thirdRowCanvas)
    } catch (error) {
      console.error('[PDF Capture] Error capturing Dashboard Part 2:', error)
      return null
    }
  }

  /**
   * Wait for an element to be present and have non-zero dimensions
   * @param {string} id - Element ID to wait for
   * @param {object} options - Wait options
   * @returns {Promise<HTMLElement|null>} - Element or null if not found
   */
  async function waitForElementById(id, options = {}) {
    const { retries = 10, delay = 500, logPrefix = '[PDF Capture]' } = options

    let element = null
    let attempt = 0

    while (attempt < retries) {
      element = document.getElementById(id)

      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          console.log(
            `${logPrefix} Element "${id}" found and visible (${Math.round(rect.width)}x${Math.round(rect.height)})`
          )
          return element
        }
      }

      attempt++
      if (attempt < retries) {
        console.log(`${logPrefix} Waiting for element "${id}"... attempt ${attempt}/${retries}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    console.warn(
      `${logPrefix} Element "${id}" not found or has zero dimensions after ${retries} attempts`
    )
    return null
  }

  /**
   * Capture and combine multiple panels into a single vertical image
   * @param {string[]} panelIds - Array of element IDs to capture
   * @param {object} options - Optional capture options
   * @returns {Promise<string|null>} - Combined compressed JPEG image or null
   * @throws {Error} - If a panel fails to update to expected lot ID after all retries
   */
  async function combinePanels(panelIds, options = {}) {
    try {
      const {
        expectedLotId,
        datasetRetries = PDF_EXPORT_CONFIG.navigation.panelDatasetRetries,
        datasetDelays = PDF_EXPORT_CONFIG.navigation.panelDatasetDelays,
        throwOnMismatch = true, // NEW: fail export entirely if panel doesn't update
        ...canvasOptions
      } = options
      const canvases = []
      let totalHeight = 0
      let maxWidth = 0
      const PANEL_SPACING = 80 // Spacing between panels (in pixels at scale 2)
      const verbose = PDF_EXPORT_CONFIG.verboseLogging

      // Capture each panel
      if (verbose) {
        console.log(`[PDF Capture] Combining ${panelIds.length} panels...`)
        if (expectedLotId) {
          console.log(`[PDF Capture] Expected lot ID: ${expectedLotId}`)
        }
      }

      for (const panelId of panelIds) {
        // Wait for element to be present and visible (components load auction data asynchronously)
        let element = await waitForElementById(panelId, {
          retries: 20, // Increased retries for async data loading
          delay: 500,
          logPrefix: '[PDF Capture]'
        })

        if (!element) {
          const errorMsg = `Panel "${panelId}" not found or not visible after all retries`
          if (throwOnMismatch) {
            throw new Error(errorMsg)
          }
          console.warn(`[PDF Capture] ${errorMsg}, skipping`)
          continue
        }

        if (expectedLotId) {
          let datasetAttempt = 0
          let currentLotId = element.dataset?.auctionId || ''

          // Use exponential backoff delays
          while (datasetAttempt < datasetRetries && currentLotId !== expectedLotId) {
            const delay = datasetDelays[datasetAttempt] || datasetDelays[datasetDelays.length - 1]
            if (verbose) {
              console.log(
                `[PDF Capture] Panel "${panelId}" bound to lot ${currentLotId || 'unknown'}, ` +
                  `waiting for ${expectedLotId} (attempt ${datasetAttempt + 1}/${datasetRetries}, delay: ${delay}ms)`
              )
            }
            await new Promise((resolve) => setTimeout(resolve, delay))
            element = document.getElementById(panelId)
            if (!element) {
              break
            }
            currentLotId = element.dataset?.auctionId || ''
            datasetAttempt++
          }

          // CRITICAL FIX: Throw error instead of skipping if panel didn't update
          if (!element || element.dataset?.auctionId !== expectedLotId) {
            const finalLotId = element?.dataset?.auctionId || 'unknown'
            const errorMsg =
              `Panel "${panelId}" did not update to lot ${expectedLotId} after ${datasetRetries} retries ` +
              `(still showing lot ${finalLotId}). This would cause wrong lot data in PDF.`

            if (throwOnMismatch) {
              console.error(`[PDF Capture] CRITICAL: ${errorMsg}`)
              throw new Error(errorMsg)
            }
            console.warn(`[PDF Capture] ${errorMsg}, skipping capture`)
            continue
          }

          if (verbose) {
            console.log(
              `[PDF Capture] ✓ Panel "${panelId}" confirmed for lot ${expectedLotId} after ${datasetAttempt} attempts`
            )
          }
        }

        const rect = element.getBoundingClientRect()
        console.log(
          `[PDF Capture] Capturing panel "${panelId}" (${Math.round(rect.width)}x${Math.round(rect.height)})`
        )

        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
          ...canvasOptions
        })

        canvases.push(canvas)
        totalHeight += canvas.height
        maxWidth = Math.max(maxWidth, canvas.width)
      }

      if (canvases.length === 0) {
        console.warn('[PDF Capture] No panels captured')
        return null
      }

      // Add spacing between panels (but not after the last one)
      totalHeight += PANEL_SPACING * (canvases.length - 1)

      // Create combined canvas
      const combinedCanvas = document.createElement('canvas')
      combinedCanvas.width = maxWidth
      combinedCanvas.height = totalHeight
      const ctx = combinedCanvas.getContext('2d')

      // Fill with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, maxWidth, totalHeight)

      // Draw each canvas vertically with spacing
      let currentY = 0
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i]
        ctx.drawImage(canvas, 0, currentY)
        currentY += canvas.height

        // Add spacing between panels (not after the last one)
        if (i < canvases.length - 1) {
          currentY += PANEL_SPACING
        }
      }

      // Convert to PNG then compress to JPEG
      const pngData = combinedCanvas.toDataURL('image/png')
      const compressedImage = await compressImage(pngData)

      console.log(
        `[PDF Capture] Combined ${canvases.length} panels with spacing: ${Math.round(compressedImage.length / 1024)} KB`
      )

      return compressedImage
    } catch (error) {
      console.error('[PDF Capture] Error combining panels:', error)
      return null
    }
  }

  /**
   * Combine existing image data URLs vertically into a single image
   * @param {string[]} imageDataList - Array of base64 image data URLs
   * @param {object} options - Combination options
   * @returns {Promise<string|null>} - Combined compressed JPEG image or null
   */
  async function combineImagesVertically(imageDataList, options = {}) {
    try {
      const validImages = (imageDataList || []).filter(Boolean)
      if (validImages.length === 0) {
        console.warn('[PDF Capture] No images provided for vertical combination')
        return null
      }

      const spacing = options.spacing ?? 40
      const backgroundColor = options.backgroundColor ?? '#ffffff'
      const quality = options.quality ?? PDF_EXPORT_CONFIG.capture.quality

      const loadImage = (dataUrl) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error('Failed to load image for combination'))
          img.src = dataUrl
        })
      }

      const images = await Promise.all(validImages.map(loadImage))

      const maxWidth = Math.max(...images.map((img) => img.width))
      const totalHeight =
        images.reduce((acc, img) => acc + img.height, 0) + spacing * (images.length - 1)

      const canvas = document.createElement('canvas')
      canvas.width = maxWidth
      canvas.height = totalHeight
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let currentY = 0
      images.forEach((img, index) => {
        ctx.drawImage(img, 0, currentY)
        currentY += img.height
        if (index < images.length - 1) {
          currentY += spacing
        }
      })

      const combinedPng = canvas.toDataURL('image/png')
      return await compressImage(combinedPng, quality)
    } catch (error) {
      console.error('[PDF Capture] Error combining images vertically:', error)
      return null
    }
  }

  return {
    compressImage,
    captureElement,
    captureElementWithRetry,
    captureById,
    captureActivityLogWithPagination,
    captureDashboardPart1,
    captureDashboardPart2,
    combinePanels,
    waitForElementById,
    combineImagesVertically
  }
}
