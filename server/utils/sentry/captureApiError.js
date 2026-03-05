/**
 * Sentry Enhanced Error Capture Utilities
 * Provides specialized error capture functions with rich business context
 */

import * as Sentry from '@sentry/nuxt'
import { sanitizeData } from './sanitize'

/**
 * Capture API error with enhanced business context
 * @param {Error} error - Error to capture
 * @param {H3Event} event - Nitro event object
 * @param {Object} context - Business context
 * @param {string} context.operation - Operation name
 * @param {string} context.auctionId - Auction ID
 * @param {string} context.bidId - Bid ID
 * @param {string} context.auctionType - Auction type (reverse, dutch, japanese, sealed-bid)
 * @param {boolean} context.critical - Whether this is a critical error
 * @returns {Promise<void>}
 */
export async function captureApiError(error, event, context = {}) {
  const {
    operation,
    auctionId,
    bidId,
    auctionType,
    critical = false,
    ...additionalContext
  } = context

  // Set custom tags
  Sentry.setTags({
    operation,
    auction_id: auctionId,
    bid_id: bidId,
    auction_type: auctionType,
    critical: critical.toString()
  })

  // Set additional context
  Sentry.setContext(
    'business_operation',
    sanitizeData({
      operation,
      auctionId,
      bidId,
      auctionType,
      ...additionalContext
    })
  )

  // Capture with appropriate level
  const level = critical ? 'error' : 'warning'
  Sentry.captureException(error, { level })
}

/**
 * Capture Cloud Task error with task metadata
 * @param {Error} error - Error to capture
 * @param {Object} taskPayload - Cloud Task payload
 * @param {Object} context - Additional context
 * @returns {Promise<void>}
 */
export async function captureCloudTaskError(error, taskPayload, context = {}) {
  const { auctionId, bidId, type } = taskPayload || {}

  Sentry.setTags({
    operation_type: 'cloud_task',
    task_type: type,
    auction_id: auctionId,
    bid_id: bidId,
    critical: 'true'
  })

  Sentry.setContext(
    'cloud_task',
    sanitizeData({
      payload: taskPayload,
      ...context
    })
  )

  Sentry.captureException(error, { level: 'error' })
}

/**
 * Capture webhook error with webhook-specific metadata
 * @param {Error} error - Error to capture
 * @param {H3Event} event - Nitro event object
 * @param {string} webhookType - Type of webhook (bid_insert, auction_insert, etc.)
 * @param {Object} recordData - Record data from webhook
 * @returns {Promise<void>}
 */
export async function captureWebhookError(error, event, webhookType, recordData = {}) {
  const { auctionId, bidId } = recordData

  Sentry.setTags({
    operation_type: 'webhook',
    webhook_type: webhookType,
    auction_id: auctionId,
    bid_id: bidId,
    critical: 'true'
  })

  Sentry.setContext(
    'webhook',
    sanitizeData({
      type: webhookType,
      record: recordData,
      headers: getRequestHeaders(event)
    })
  )

  Sentry.captureException(error, { level: 'error' })
}

/**
 * Capture auction operation error with auction state
 * @param {Error} error - Error to capture
 * @param {Object} auction - Auction object
 * @param {string} operation - Operation being performed
 * @param {Object} context - Additional context
 * @returns {Promise<void>}
 */
export async function captureAuctionOperation(error, auction, operation, context = {}) {
  Sentry.setTags({
    operation_type: 'auction_operation',
    operation,
    auction_id: auction?.id,
    auction_type: auction?.type,
    critical: 'true'
  })

  Sentry.setContext(
    'auction_operation',
    sanitizeData({
      operation,
      auction: {
        id: auction?.id,
        type: auction?.type,
        start_at: auction?.start_at,
        end_at: auction?.end_at,
        usage: auction?.usage
      },
      ...context
    })
  )

  Sentry.captureException(error, { level: 'error' })
}
