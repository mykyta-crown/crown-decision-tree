import Intercom from '@intercom/messenger-js-sdk'

/**
 * Start a specific Intercom Product Tour once per user.
 * Fallback gating uses localStorage keyed by user id and tour id.
 * Optionally accepts a pre-checked completion flag from backend/webhook sync.
 */
export default function useIntercomTour() {
  function generateKey(userId, tourId) {
    return `intercom_tour_completed:${userId}:${tourId}`
  }

  function isTourMarkedCompleted(userId, tourId) {
    try {
      const key = generateKey(userId, tourId)
      return localStorage.getItem(key) === 'true'
    } catch {
      return false
    }
  }

  function markTourCompleted(userId, tourId) {
    try {
      const key = generateKey(userId, tourId)
      localStorage.setItem(key, 'true')
    } catch {
      // ignore storage errors (e.g., SSR or privacy mode)
    }
  }

  /**
   * Starts the tour if not completed. Returns true if the tour was triggered.
   * @param {Object} opts
   * @param {string} opts.userId - Current user id
   * @param {string} opts.tourId - Intercom tour id/slug
   * @param {boolean} [opts.hasCompletedFromBackend] - If provided, trusted source of completion (e.g., webhook-synced)
   */
  function startTourOnce({ userId, tourId, hasCompletedFromBackend }) {
    if (!userId || !tourId) return false

    const completed = hasCompletedFromBackend === true || isTourMarkedCompleted(userId, tourId)
    if (completed) return false

    try {
      // Start the Intercom Product Tour
      Intercom('startTour', tourId)

      // We optimistically mark as completed to avoid repeats in the same session.
      // Webhook can later correct this if needed.
      markTourCompleted(userId, tourId)
      return true
    } catch {
      return false
    }
  }

  return {
    startTourOnce,
    isTourMarkedCompleted,
    markTourCompleted
  }
}
