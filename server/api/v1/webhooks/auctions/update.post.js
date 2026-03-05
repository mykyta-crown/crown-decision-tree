import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import dayjs from 'dayjs'
import { captureWebhookError } from '~/server/utils/sentry/captureApiError'

// Get effective duration for an auction (sealed-bid has duration=0 in DB)
function getEffectiveDuration(auction) {
  if (auction.type === 'sealed-bid') {
    // Training only: fixed 2 min duration (controlled by Start Training button)
    if (auction.usage === 'training') {
      return 2
    }
    // Real and test sealed-bid: duration is set via explicit end_at, calculate from actual timing
    if (auction.start_at && auction.end_at) {
      const diff = dayjs(auction.end_at).diff(dayjs(auction.start_at), 'minute')
      return diff > 0 ? diff : 0
    }
    return 0
  }
  return auction.duration
}

export default defineEventHandler(async (event) => {
  let updatedAuction, oldAuction
  try {
    const { authorization, 'x-vercel-oidc-token': oidcToken } = getRequestHeaders(event)
    const config = useRuntimeConfig()

    // Get the expected webhook token from environment (required)
    const expectedToken = config.webhookBearerToken

    if (!expectedToken) {
      console.error('[Webhook auctions/update] WEBHOOK_BEARER_TOKEN not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Webhook authentication not configured'
      })
    }

    // Verify webhook authentication
    if (!authorization || authorization !== `Bearer ${expectedToken}`) {
      console.error('[Webhook auctions/update] Unauthorized access attempt', {
        received: authorization ? 'Bearer ***' : 'none'
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody(event)
    updatedAuction = body.record
    oldAuction = body.old_record

    // Use serverSupabaseClient for broadcasts (no admin needed)
    const supabaseClient = await serverSupabaseClient(event)

    // Use admin client for database writes (bypass RLS)
    const supabaseAdmin = createClient(config.public.supabase.url, config.supabaseAdminKey)
    const channelName = `broadcast_auctions_id=eq.${updatedAuction.id}`

    try {
      await supabaseClient.channel(channelName).send({
        type: 'broadcast',
        event: 'UPDATE',
        payload: {
          record: updatedAuction,
          old_record: oldAuction
        }
      })
    } catch (error) {
      console.error('[Webhook auctions/update] Error sending broadcast:', error)
      await captureWebhookError(error, event, 'auction_broadcast', {
        auctionId: updatedAuction.id
      })
    }
    //TODO: Make sure it does not conflict with ulti lot
    if (updatedAuction.type === 'japanese') {
      await japaneseScheduleAuctionRounds(updatedAuction, oidcToken)
    }

    await updatePreBidsToScheduler(updatedAuction, oldAuction, oidcToken)

    // Note: Bot prebid triggering for reverse training auctions is now handled
    // directly in the restart endpoint (server/api/v1/auctions/[auctionId]/restart.post.js)
    // to avoid race conditions and duplicate triggers

    const groupId = updatedAuction.auctions_group_settings_id

    const { data: groupSettings, error: groupError } = await supabaseAdmin
      .from('auctions_group_settings')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError) {
      console.error('[Webhook auctions/update] Failed to fetch group settings:', {
        groupId,
        error: groupError.message
      })
      return
    }

    const timingRule = groupSettings.timing_rule

    const { data: nextAuction, error: nextAuctionError } = await supabaseAdmin
      .from('auctions')
      .select('*')
      .match({
        auctions_group_settings_id: groupId,
        lot_number: updatedAuction.lot_number + 1
      })
      .single()

    if (nextAuctionError) {
      return
    }

    // Stop the logic if there is no next auction.
    if (!nextAuction) {
      return
    }
    // Stop the logic if auction is already finished.
    if (dayjs(nextAuction.end_at).isBefore(dayjs())) {
      return
    }

    if (timingRule === 'serial') {
      // Check if the previous auction already started (specific to 'dutch' auctions)
      // Exception: training auctions ending early should always update next lot timing
      const isPreviousDutchOrJapaneseStarted =
        (nextAuction.type === 'dutch' || nextAuction.type === 'japanese') &&
        dayjs(updatedAuction.start_at).isBefore(dayjs())
      const isTrainingEndingEarly =
        updatedAuction.usage === 'training' &&
        oldAuction.end_at !== updatedAuction.end_at &&
        dayjs(updatedAuction.end_at).isBefore(dayjs(oldAuction.end_at))
      if (!isPreviousDutchOrJapaneseStarted || isTrainingEndingEarly) {
        // Fetch fresh end_at after trigger execution
        const { data: freshAuction, error: fetchError } = await supabaseAdmin
          .from('auctions')
          .select('end_at')
          .eq('id', updatedAuction.id)
          .single()

        // Use fresh value or fallback to payload
        const actualEndAt = fetchError ? updatedAuction.end_at : freshAuction.end_at

        if (fetchError) {
          console.error('[Webhook auctions/update] Failed to fetch fresh end_at:', {
            auctionId: updatedAuction.id,
            error: fetchError.message,
            fallback: 'using webhook payload end_at'
          })
        }

        // For training auctions, add 15 second gap before next lot starts
        const isTraining = updatedAuction.usage === 'training'
        const nextStartAt = isTraining ? dayjs(actualEndAt).add(15, 'second') : dayjs(actualEndAt)

        // Update next auction with actual end time
        const { error: updateError } = await supabaseAdmin
          .from('auctions')
          .update({
            start_at: nextStartAt.toISOString(),
            end_at: nextStartAt.add(getEffectiveDuration(nextAuction), 'minute').toISOString()
          })
          .eq('id', nextAuction.id)

        if (updateError) {
          console.error('[Webhook auctions/update] Failed to update serial auction timing:', {
            nextAuctionId: nextAuction.id,
            error: updateError.message,
            details: updateError.details
          })
        }
      }
    }

    if (timingRule === 'staggered') {
      // Fetch fresh end_at for staggered timing too
      const { data: freshAuction, error: fetchError } = await supabaseAdmin
        .from('auctions')
        .select('end_at')
        .eq('id', updatedAuction.id)
        .single()

      const actualEndAt = fetchError ? updatedAuction.end_at : freshAuction.end_at

      if (fetchError) {
        console.error('[Webhook auctions/update] Failed to fetch fresh end_at for staggered:', {
          auctionId: updatedAuction.id,
          error: fetchError.message
        })
      }

      const auctionEndAt = dayjs(actualEndAt)
      const nextAuctionEnAt = dayjs(nextAuction.end_at)

      const initialDurationDiff =
        getEffectiveDuration(nextAuction) - getEffectiveDuration(updatedAuction)
      const durationDiff = (+nextAuctionEnAt - +auctionEndAt) / (1000 * 60)

      if (durationDiff < initialDurationDiff) {
        const { error: updateError } = await supabaseAdmin
          .from('auctions')
          .update({
            end_at: dayjs(actualEndAt).add(initialDurationDiff, 'minute')
          })
          .eq('id', nextAuction.id)

        if (updateError) {
          console.error('[Webhook auctions/update] Failed to update staggered auction timing:', {
            nextAuctionId: nextAuction.id,
            error: updateError.message,
            details: updateError.details
          })
        }
      }
    }
  } catch (error) {
    console.error('[Webhook auctions/update] Error processing auction update:', {
      error: error.message,
      stack: error.stack,
      auctionId: updatedAuction?.id
    })

    // Capture error in Sentry with webhook context
    await captureWebhookError(error, event, 'auction_update', {
      auctionId: updatedAuction?.id
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        auctionId: updatedAuction?.id
      }
    })
  }
})
