import { serverSupabaseClient } from '#supabase/server'
import { captureWebhookError } from '~/server/utils/sentry/captureApiError'
import { isBotEmail } from '~/server/utils/bots'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)

export default defineEventHandler(async (event) => {
  const { authorization, 'x-vercel-oidc-token': oidcToken } = getRequestHeaders(event)
  const config = useRuntimeConfig()

  // Get the expected webhook token from environment (required)
  const expectedToken = config.webhookBearerToken

  if (!expectedToken) {
    console.error('[Webhook bids/insert] WEBHOOK_BEARER_TOKEN not configured')
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook authentication not configured'
    })
  }

  // Verify webhook authentication
  if (!authorization || authorization !== `Bearer ${expectedToken}`) {
    console.error('[Webhook bids/insert] Unauthorized access attempt', {
      received: authorization ? 'Bearer ***' : 'none'
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)

  if (!body?.record?.auction_id) {
    throw createError({
      ...ERROR_TYPES.INVALID_INPUT,
      data: { receivedBody: body }
    })
  }

  try {
    const bid = body.record
    const auctionId = bid.auction_id

    // Send broadcast to notify clients about the bid insertion
    const supabase = await serverSupabaseClient(event)
    const channelName = `broadcast_bids_auction_id=eq.${auctionId}`

    try {
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'INSERT',
        payload: {
          record: bid
        }
      })
    } catch (error) {
      console.error('Error sending broadcast:', error)
      await captureWebhookError(error, event, 'bid_broadcast', {
        auctionId: bid.auction_id,
        bidId: bid.id
      })
    }

    const { data: auction, error: errorFetchAuction } = await fetchAuction(auctionId)
    if (errorFetchAuction) {
      throw createError({
        statusCode: errorFetchAuction.statusCode,
        message: errorFetchAuction.message
      })
    }

    // Check if the bid was created within the auction time window
    // Use bid creation time instead of current time to handle webhook processing delays
    const bidCreatedAt = dayjs.utc(bid.created_at)
    const auctionStartAt = dayjs.utc(auction.start_at)
    const auctionEndAt = dayjs.utc(auction.end_at)

    // Check if auction is in overtime period
    // This matches the logic in update_last_bid_auction_time trigger
    const minutesFromEnd =
      auctionEndAt.diff(dayjs.utc(), 'minutes', true) - (auction.overtime_range || 0)
    const isInOvertime = minutesFromEnd <= 0

    // Allow bids during overtime even if after original end_at
    // The trigger will extend end_at automatically
    if (bidCreatedAt.isAfter(auctionEndAt) && !isInOvertime) {
      throw createError({
        ...ERROR_TYPES.AUCTION_CLOSED,
        data: {
          auction,
          bidCreatedAt: bid.created_at,
          auctionEndAt: auction.end_at,
          isInOvertime: false
        }
      })
    }

    // Note: Pre-auction bids (prebids) are allowed and should trigger training
    // The training endpoint handles the logic of whether to place initial prebids
    // or competitive bids based on auction state

    // Check if this bid is from a bot to prevent infinite loops
    // Bots should not trigger bot reactions
    const { data: bidderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', bid.seller_id)
      .single()

    if (profileError) {
      console.error('[WEBHOOK BID INSERT] Error fetching bidder profile:', profileError)
    }

    const isBotBid = bidderProfile && isBotEmail(bidderProfile.email)

    if (isBotBid) {
      return {
        success: true,
        data: {
          bidId: bid.id,
          auctionId: auction.id,
          message: 'Bot bid processed, no training triggered'
        }
      }
    }

    let bidResult
    switch (auction.type) {
      case 'dutch':
        // Only schedule prebid execution when prebid mode is enabled
        if (auction.dutch_prebid_enabled) {
          bidResult = await dutchAddPreBidToScheduler(auction, bid, oidcToken)
        } else {
          bidResult = { success: true, message: 'Prebid disabled, no scheduling needed' }
        }
        // For training/test Dutch auctions, also trigger bot behavior
        if (auction.usage === 'training' || auction.usage === 'test') {
          try {
            const response = await $fetch(`/api/v1/auctions/${auctionId}/training`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            })
          } catch (error) {
            console.error('[WEBHOOK BID INSERT] Error triggering bot training for Dutch:', error)
            // Don't throw - let the bid insertion succeed even if bot training fails
          }
        }

        // End training auction immediately after live bid is placed (only for serial timing)
        // This complements the same logic in auto_bid.js for prebids
        if (
          bid.type === 'bid' &&
          auction.usage === 'training' &&
          auction.auctions_group_settings_id
        ) {
          const { data: groupSettings } = await supabase
            .from('auctions_group_settings')
            .select('timing_rule')
            .eq('id', auction.auctions_group_settings_id)
            .single()

          if (groupSettings?.timing_rule === 'serial') {
            console.log(
              `[WEBHOOK BID INSERT] 🛑 Ending Dutch training auction immediately (serial timing)`
            )
            const { error: updateError } = await supabase
              .from('auctions')
              .update({ end_at: new Date().toISOString() })
              .eq('id', auction.id)

            if (updateError) {
              console.error(`[WEBHOOK BID INSERT] Error ending training auction:`, updateError)
            }
          }
        }
        break
      case 'japanese':
      case 'reverse':
        // For Japanese and reverse (English) auctions with training/test mode, trigger bot reaction
        if (auction.usage === 'training' || auction.usage === 'test') {
          try {
            const response = await $fetch(`/api/v1/auctions/${auctionId}/training`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            })
            bidResult = { success: true, data: response }
          } catch (error) {
            console.error(
              `[WEBHOOK BID INSERT] Error triggering bot training for ${auction.type}:`,
              error
            )
            // Don't throw - let the bid insertion succeed even if bot training fails
            bidResult = { success: true, warning: 'Bot training failed', error: error.message }
          }
        } else {
          bidResult = { success: true, message: 'No bot action needed for non-training auction' }
        }
        break
      default:
        // For other auction types, just return success (no special processing needed)
        bidResult = { success: true, message: 'No special processing for this auction type' }
    }

    if (!bidResult?.success) {
      throw createError({
        ...ERROR_TYPES.BID_PROCESSING_FAILED,
        message: bidResult?.error?.message || ERROR_TYPES.BID_PROCESSING_FAILED.message,
        data: { auctionId: auction.id, bidId: bid.id }
      })
    }

    return {
      success: true,
      data: {
        bidId: bid.id,
        auctionId: auction.id
      }
    }
  } catch (error) {
    console.error('Error processing bid:', {
      error: error.message,
      stack: error.stack,
      data: {
        bidId: body?.record?.id,
        auctionId: body?.record?.auction_id
      }
    })

    // Capture error in Sentry with webhook context
    await captureWebhookError(error, event, 'bid_insert', {
      auctionId: body?.record?.auction_id,
      bidId: body?.record?.id
    })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      ...ERROR_TYPES.INTERNAL_ERROR,
      data: {
        bidId: body?.record?.id,
        auctionId: body?.record?.auction_id
      }
    })
  }
})
