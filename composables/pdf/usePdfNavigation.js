/**
 * PDF Navigation Composable
 * Handles multi-lot navigation during PDF export
 */

import { PDF_EXPORT_CONFIG } from './config'
import { clearAuctionMemoizeCache } from '../useUserAuctionBids'

export const usePdfNavigation = () => {
  const supabase = useSupabaseClient()
  const route = useRoute()

  /**
   * Fetch all lots in an auction group
   * @param {string} groupId - Auction group ID
   * @returns {Promise<Array>} - Array of lot objects
   */
  async function fetchLots(groupId) {
    const { data: fetchedLots, error } = await supabase
      .from('auctions')
      .select('id, lot_number, lot_name, name')
      .eq('auctions_group_settings_id', groupId)
      .order('lot_number')

    if (error) {
      console.error('[PDF Navigation] Error fetching lots:', error)
      return []
    }

    return fetchedLots || []
  }

  /**
   * Filter out "break" lots (separator lots)
   * @param {Array} lots - Array of lot objects
   * @returns {Array} - Filtered lots
   */
  function filterBreakLots(lots) {
    const allLotsCount = lots.length

    const filtered = lots.filter((lot) => {
      const lotName = (lot.lot_name || lot.name || '').toLowerCase()
      const isBreakLot = lotName.includes('break')

      if (isBreakLot) {
        console.log(
          `[PDF Navigation] Skipping break lot: "${lot.lot_name || lot.name}" (Lot ${lot.lot_number})`
        )
      }

      return !isBreakLot
    })

    if (allLotsCount !== filtered.length) {
      console.log(`[PDF Navigation] Filtered out ${allLotsCount - filtered.length} break lot(s)`)
    }

    return filtered
  }

  /**
   * Navigate to a specific lot
   * @param {string} groupId - Auction group ID
   * @param {string} lotId - Lot ID to navigate to
   * @param {boolean} multilot - Whether this is a multi-lot auction
   * @returns {Promise<boolean>} - Success status
   */
  async function navigateToLot(groupId, lotId, multilot = true, forceNavigation = false) {
    console.log(`[PDF Navigation] Navigating to lot ${lotId}...`)

    // Add timestamp to force Nuxt to treat this as a fresh navigation (bust cache)
    const timestamp = Date.now()
    const targetRoute = multilot
      ? `/auctions/${groupId}/lots/${lotId}/buyer?multilot=true&_t=${timestamp}`
      : `/auctions/${groupId}/lots/${lotId}/buyer?_t=${timestamp}`

    // Check current URL using window.location (reliable, not stale like route object)
    const currentUrlLotMatch = window.location.pathname.match(/\/lots\/([^/]+)\//)
    const currentUrlLotId = currentUrlLotMatch ? currentUrlLotMatch[1] : null

    // Skip navigation only if URL definitively shows we're on the target lot
    // AND forceNavigation is not requested
    if (!forceNavigation && currentUrlLotId === lotId) {
      console.log(`[PDF Navigation] URL confirms already on lot ${lotId}, skipping navigation`)
      return true
    }

    console.log(
      `[PDF Navigation] Current URL lot: ${currentUrlLotId || 'unknown'}, navigating to ${targetRoute}`
    )

    // Use navigateTo for SPA navigation (keeps JS context alive for export)
    // Note: reloadNuxtApp would kill the export process
    try {
      await navigateTo(targetRoute, { replace: true })
    } catch (navError) {
      console.error('[PDF Navigation] Navigation error:', navError)
      return false
    }

    // Wait for navigation to complete and components to mount
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await nextTick()

    // Clear memoize caches AFTER navigation to force fresh data fetch
    clearAuctionMemoizeCache()

    // Additional wait for data to load
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await nextTick()

    // Verify navigation succeeded
    const urlPath = window.location.pathname
    if (urlPath.includes(`/lots/${lotId}/`)) {
      console.log(`[PDF Navigation] Successfully navigated to lot ${lotId}`)
      return true
    }

    console.error(`[PDF Navigation] Navigation verification failed. URL: ${urlPath}`)
    return false
  }

  /**
   * Wait for components to load after navigation
   * @param {number} delay - Delay in milliseconds
   */
  async function waitForComponentLoad(timeout = PDF_EXPORT_CONFIG.navigation.componentLoadDelay) {
    if (!import.meta.client) {
      await new Promise((resolve) => setTimeout(resolve, timeout))
      return
    }

    const requiredSelectors = [
      `#${PDF_EXPORT_CONFIG.elements.dashboard}`,
      `#${PDF_EXPORT_CONFIG.elements.activityLog}`
    ]

    const pollInterval = 150
    const deadline = Date.now() + timeout

    while (Date.now() < deadline) {
      await nextTick()

      const allReady = requiredSelectors.every((selector) => {
        const element = document.querySelector(selector)
        if (!element) {
          return false
        }
        const { offsetHeight, offsetWidth } = element
        return offsetHeight > 0 && offsetWidth > 0
      })

      if (allReady) {
        return
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    console.warn(
      '[PDF Navigation] Timed out waiting for dashboard components, proceeding with fallback delay'
    )
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  /**
   * Ensure we start from the first lot
   * @param {Array} lots - Array of lots
   * @param {string} groupId - Auction group ID
   * @returns {Promise<boolean>} - Success status
   */
  async function ensureFirstLot(lots, groupId) {
    if (!lots || lots.length === 0) {
      console.error('[PDF Navigation] No lots provided')
      return false
    }

    const firstLot = lots[0]

    if (route.params.auctionId === firstLot.id) {
      console.log(`[PDF Navigation] Already on first lot ${firstLot.id}`)
      return true
    }

    console.log(
      `[PDF Navigation] ⚠️ Currently on lot ${route.params.auctionId}, forcing navigation to FIRST lot ${firstLot.id}`
    )

    const success = await navigateToLot(groupId, firstLot.id, true)

    if (success) {
      await waitForComponentLoad()
      console.log('[PDF Navigation] Ready to start export from lot 1')
    }

    return success
  }

  return {
    fetchLots,
    filterBreakLots,
    navigateToLot,
    waitForComponentLoad,
    ensureFirstLot
  }
}
