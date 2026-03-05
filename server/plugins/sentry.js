/**
 * Sentry Nitro Plugin
 * Automatically captures all API errors with rich context
 *
 * This plugin hooks into Nitro's error and request lifecycle to:
 * - Capture all unhandled API errors automatically
 * - Extract user context from Supabase auth
 * - Add auction/bid metadata from request
 * - Filter sensitive data (passwords, tokens)
 * - Track API performance metrics
 */

import * as Sentry from '@sentry/nuxt'
import { extractUserContext, extractAuctionContext } from '~/server/utils/sentry/extractContext'
import { sanitizeData, sanitizeHeaders } from '~/server/utils/sentry/sanitize'

const isVercelDeployment = !!process.env.VERCEL_ENV
const isLocalDevelopment = !isVercelDeployment && process.env.NODE_ENV === 'development'

export default defineNitroPlugin((nitroApp) => {
  // Disable Sentry in local development (only active on Vercel)
  if (isLocalDevelopment || !process.env.NUXT_PUBLIC_SENTRY_DSN) {
    console.log('[Sentry Plugin] Disabled for local development')
    return
  }

  console.log('[Sentry Plugin] Initializing API error tracking for', process.env.VERCEL_ENV)

  // Hook: Capture all API errors
  nitroApp.hooks.hook('error', async (error, { event }) => {
    try {
      // Skip ignored errors (non-actionable)
      if (shouldIgnoreError(error)) {
        return
      }

      // Extract context asynchronously
      const userContext = await extractUserContext(event)
      const auctionContext = await extractAuctionContext(event)

      // Extract request body safely (might already be consumed)
      let requestBody = null
      try {
        requestBody = await readBody(event)
      } catch (err) {
        // Body already consumed or not available, skip
      }

      // Set Sentry user context
      if (userContext) {
        Sentry.setUser(userContext)
      }

      // Set request context
      Sentry.setContext('request', {
        url: event.path,
        method: event.method,
        headers: sanitizeHeaders(getRequestHeaders(event)),
        body: sanitizeData(requestBody),
        query: event.context.params
      })

      // Set auction context if available
      if (auctionContext) {
        Sentry.setContext('auction', auctionContext)
      }

      // Set tags for filtering/searching
      const headers = getRequestHeaders(event)
      Sentry.setTags({
        endpoint: event.path,
        method: event.method,
        status_code: error.statusCode || 500,
        operation_type: identifyOperationType(event.path),
        auction_type: auctionContext?.type,
        is_critical: isCriticalEndpoint(event.path),
        is_webhook: event.path.includes('/webhooks/'),
        is_cloud_task: !!headers['x-cloudtasks-queuename'],
        environment: process.env.VERCEL_ENV
      })

      // Capture exception with appropriate level
      Sentry.captureException(error, {
        level: getSentryLevel(error.statusCode)
      })

      console.log('[Sentry] Error captured:', {
        path: event.path,
        statusCode: error.statusCode,
        message: error.message
      })
    } catch (captureError) {
      // Don't let Sentry errors break the application
      console.error('[Sentry Plugin] Error during capture:', captureError.message)
    }
  })

  // Hook: Start performance span for each request (Sentry v8+)
  nitroApp.hooks.hook('request', async (event) => {
    try {
      // Skip performance tracking for non-critical endpoints to reduce overhead
      if (!shouldTrackPerformance(event.path)) {
        return
      }

      // Sentry v8 uses startSpan instead of startTransaction
      const span = Sentry.startInactiveSpan({
        op: 'http.server',
        name: `${event.method} ${event.path}`,
        attributes: {
          endpoint: event.path,
          method: event.method
        }
      })

      // Store span in event context for cleanup
      event.context.sentrySpan = span
    } catch (err) {
      console.error('[Sentry Plugin] Error starting span:', err.message)
    }
  })

  // Hook: Finish performance span after response
  nitroApp.hooks.hook('afterResponse', (event) => {
    try {
      event.context.sentrySpan?.end()
    } catch (err) {
      console.error('[Sentry Plugin] Error finishing span:', err.message)
    }
  })
})

/**
 * Check if error should be ignored (non-actionable)
 * @param {Error} error - Error object
 * @returns {boolean} True if should ignore
 */
function shouldIgnoreError(error) {
  // Network errors (user connectivity issues, not our bugs)
  const IGNORED_ERRORS = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED']

  // Expected business logic errors (not bugs)
  const IGNORED_STATUS_CODES = [
    401, // Unauthorized - Expected auth failures
    404 // Not Found - Expected when resource doesn't exist
  ]

  const errorMessage = error.message || ''
  const hasIgnoredMessage = IGNORED_ERRORS.some((msg) => errorMessage.includes(msg))
  const hasIgnoredStatus = IGNORED_STATUS_CODES.includes(error.statusCode)

  return hasIgnoredMessage || hasIgnoredStatus
}

/**
 * Get Sentry error level based on HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Sentry level (error, warning, info)
 */
function getSentryLevel(statusCode) {
  if (!statusCode) return 'error'
  if (statusCode >= 500) return 'error' // Server errors
  if (statusCode >= 400) return 'warning' // Client errors
  return 'info'
}

/**
 * Check if endpoint is critical (requires immediate attention)
 * @param {string} path - Request path
 * @returns {boolean} True if critical
 */
function isCriticalEndpoint(path) {
  return (
    path.includes('/webhooks/') ||
    path.includes('/dutch/auto_bid') ||
    path.includes('/japanese/round_handler') ||
    path.includes('/training')
  )
}

/**
 * Identify operation type from request path
 * @param {string} path - Request path
 * @returns {string} Operation type
 */
function identifyOperationType(path) {
  if (path.includes('/webhooks/bids')) return 'bid_webhook'
  if (path.includes('/webhooks/auctions')) return 'auction_webhook'
  if (path.includes('/webhooks/users')) return 'user_webhook'
  if (path.includes('/dutch/auto_bid')) return 'dutch_autobid'
  if (path.includes('/japanese/round_handler')) return 'japanese_round'
  if (path.includes('/training')) return 'bot_training'
  if (path.includes('/conversations')) return 'ai_conversation'
  if (path.includes('/gpts')) return 'gpt_operation'
  return 'general_api'
}

/**
 * Check if performance tracking should be enabled for this endpoint
 * @param {string} path - Request path
 * @returns {boolean} True if should track
 */
function shouldTrackPerformance(path) {
  // Only track critical endpoints to reduce overhead and cost
  return isCriticalEndpoint(path) || path.includes('/auctions/') || path.includes('/bids/')
}
