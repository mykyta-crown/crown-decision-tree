/**
 * Composable for managing training guidance tooltip state
 * Handles tip visibility, dismissals, and user preferences
 */
export default function useTrainingGuidance() {
  const { user } = useUser()

  // State
  const tipsEnabled = ref(true)
  const dismissedTooltips = ref(new Set())
  const activeTooltip = ref(null)

  // LocalStorage key for tips preference
  const tipsStorageKey = computed(() => {
    return user.value?.id ? `crown-training-tips:${user.value.id}` : null
  })

  /**
   * Load tips preference from localStorage
   */
  function loadTipsPreference() {
    if (!import.meta.client || !tipsStorageKey.value) return

    try {
      const stored = localStorage.getItem(tipsStorageKey.value)
      // Default to true if not set
      tipsEnabled.value = stored !== 'false'
    } catch {
      tipsEnabled.value = true
    }
  }

  /**
   * Save tips preference to localStorage
   */
  function saveTipsPreference() {
    if (!import.meta.client || !tipsStorageKey.value) return

    try {
      localStorage.setItem(tipsStorageKey.value, String(tipsEnabled.value))
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Toggle tips on/off
   */
  function setTipsEnabled(enabled) {
    tipsEnabled.value = enabled
    saveTipsPreference()
  }

  /**
   * Check if a tooltip should be shown
   * @param {string} tooltipId - Unique identifier for the tooltip
   * @returns {boolean}
   */
  function shouldShowTooltip(tooltipId) {
    if (!tipsEnabled.value) return false
    if (dismissedTooltips.value.has(tooltipId)) return false
    return true
  }

  /**
   * Dismiss a tooltip (session-based)
   * @param {string} tooltipId - Unique identifier for the tooltip
   */
  function dismissTooltip(tooltipId) {
    dismissedTooltips.value.add(tooltipId)
    // Force reactivity
    dismissedTooltips.value = new Set(dismissedTooltips.value)

    // Clear active tooltip if it was dismissed
    if (activeTooltip.value === tooltipId) {
      activeTooltip.value = null
    }
  }

  /**
   * Set the currently active tooltip
   * @param {string|null} tooltipId
   */
  function setActiveTooltip(tooltipId) {
    activeTooltip.value = tooltipId
  }

  /**
   * Check if a specific tooltip is active
   * @param {string} tooltipId
   * @returns {boolean}
   */
  function isTooltipActive(tooltipId) {
    return activeTooltip.value === tooltipId
  }

  /**
   * Reset all dismissed tooltips (for re-training)
   */
  function resetDismissedTooltips() {
    dismissedTooltips.value = new Set()
    activeTooltip.value = null
  }

  /**
   * Check if any tooltip has been dismissed
   */
  const hasInteractedWithGuidance = computed(() => {
    return dismissedTooltips.value.size > 0
  })

  // Initialize on client
  if (import.meta.client) {
    // Load preference when user becomes available
    watch(
      () => user.value?.id,
      (userId) => {
        if (userId) {
          loadTipsPreference()
        }
      },
      { immediate: true }
    )
  }

  return {
    // State
    tipsEnabled: readonly(tipsEnabled),
    dismissedTooltips: readonly(dismissedTooltips),
    activeTooltip: readonly(activeTooltip),
    hasInteractedWithGuidance,

    // Methods
    setTipsEnabled,
    shouldShowTooltip,
    dismissTooltip,
    setActiveTooltip,
    isTooltipActive,
    resetDismissedTooltips,
    loadTipsPreference
  }
}
