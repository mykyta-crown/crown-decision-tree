import { serverSupabaseClient } from '#supabase/server'
import { captureWebhookError } from '~/server/utils/sentry/captureApiError'
import { japaneseScheduleAuctionRounds } from '~/server/utils/japanese/scheduleAuctionRounds'

export default defineEventHandler(async (event) => {
  try {
    console.log('Entering Auction webhook')
    const { authorization, 'x-vercel-oidc-token': oidcToken } = getRequestHeaders(event)
    const config = useRuntimeConfig()

    // Get the expected webhook token from environment (required)
    const expectedToken = config.webhookBearerToken

    if (!expectedToken) {
      console.error('[Webhook auctions/insert] WEBHOOK_BEARER_TOKEN not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Webhook authentication not configured'
      })
    }

    // Verify webhook authentication
    if (!authorization || authorization !== `Bearer ${expectedToken}`) {
      console.error('[Webhook auctions/insert] Unauthorized access attempt', {
        received: authorization ? 'Bearer ***' : 'none'
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    const auction = body.record

    console.log('Insert Auction webhook: ', auction)

    // Send broadcast to notify clients about the auction insertion
    const supabase = await serverSupabaseClient(event)
    const channelName = `broadcast_auctions_id=eq.${auction.id}`

    try {
      await supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'INSERT',
        payload: {
          record: auction
        }
      })
      console.log('Broadcast sent for auction insert:', auction.id)
    } catch (error) {
      console.error('Error sending broadcast:', error)
      await captureWebhookError(error, event, 'auction_broadcast', {
        auctionId: auction.id
      })
    }

    switch (auction.type) {
      case 'japanese':
        console.log('HERE japaneseScheduleAuctionRounds INSERT')
        await japaneseScheduleAuctionRounds(auction, oidcToken)
        break
      default:
        throw createError({
          ...ERROR_TYPES.INVALID_AUCTION_TYPE,
          data: { auction }
        })
    }

    return {
      success: true
    }
  } catch (error) {
    console.log('error: ', error)

    // Capture error in Sentry with webhook context
    await captureWebhookError(error, event, 'auction_insert', {
      auctionId: body?.record?.id
    })

    return { success: false, error: error.message }
  }
})
