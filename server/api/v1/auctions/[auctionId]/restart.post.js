import dayjs from 'dayjs'
import { deleteTasksForAuction } from '~/server/utils/enqueuer'

export default defineEventHandler(async (event) => {
  const { auctionId } = getRouterParams(event)
  const { 'x-vercel-oidc-token': oidcToken } = getRequestHeaders(event)
  const body = await readBody(event).catch(() => ({}))

  // Custom timing can be passed for multi-lot auctions
  const customStartAt = body?.startAt
  const customEndAt = body?.endAt

  const { data: auction } = await fetchAuction(auctionId)

  if (auction.usage === 'training' || auction.usage === 'test') {
    // Delete any pending Cloud Tasks from previous runs for Japanese and Dutch auctions
    // This prevents old scheduled rounds/prebids from executing after restart
    if (auction.type === 'japanese') {
      console.log(`[Restart] Deleting Japanese tasks for auction ${auctionId}...`)
      const deleteResult = await deleteTasksForAuction(auctionId, 'JAPANESE', oidcToken)
      if (deleteResult.success) {
        console.log(
          `[Restart] Successfully deleted ${deleteResult.data?.deletedCount || 0} Japanese tasks`
        )
      } else {
        console.error('[Restart] Failed to delete Japanese tasks:', deleteResult.error)
      }
    } else if (auction.type === 'dutch' || auction.type === 'preferred-dutch') {
      console.log(`[Restart] Deleting Dutch tasks for auction ${auctionId}...`)
      const deleteResult = await deleteTasksForAuction(auctionId, 'DUTCH', oidcToken)
      if (deleteResult.success) {
        console.log(
          `[Restart] Successfully deleted ${deleteResult.data?.deletedCount || 0} Dutch tasks`
        )
      } else {
        console.error('[Restart] Failed to delete Dutch tasks:', deleteResult.error)
      }
    }

    // Determine if this is a RESET (no custom timing) or START (with custom timing)
    const isReset = !customStartAt || !customEndAt

    // Delete all bids during RESET action, or if the auction has already started
    const currentStartDate = dayjs(
      auction.type === 'sealed-bid' ? auction.created_at : auction.start_at
    )
    if (isReset || currentStartDate.isBefore(dayjs())) {
      await supabase.from('bids').delete().eq('auction_id', auctionId)
    }

    // Reset seller state for training restart
    // - exit_time: always reset to allow sellers to participate again in Japanese auctions
    // - terms_accepted: never reset for training to avoid forcing users through terms flow again
    await supabase.from('auctions_sellers').update({ exit_time: null }).eq('auction_id', auctionId)

    // Set timing - use custom timing if provided, otherwise calculate default
    let startAt, endAt

    if (customStartAt && customEndAt) {
      // Use custom timing passed by caller (for multi-lot sequential/parallel)
      startAt = dayjs(customStartAt)
      endAt = dayjs(customEndAt)
      console.log(
        `[Restart] Using custom timing for ${auctionId}: ${startAt.toISOString()} -> ${endAt.toISOString()}`
      )
    } else {
      // Default timing: J+1 (tomorrow at 10:00) to give user time to place prebids
      // Status will automatically be 'upcoming' until start_at
      startAt = dayjs().add(1, 'day').startOf('day').add(10, 'hour').set('millisecond', 0)
      // Sealed-bid has duration=0 in DB
      let trainingDuration = auction.duration
      if (auction.type === 'sealed-bid') {
        if (auction.usage === 'training') {
          trainingDuration = 2
        } else {
          // Test: calculate from actual timing (active from creation)
          const diff = dayjs(auction.end_at).diff(dayjs(auction.start_at), 'minute')
          trainingDuration = diff > 0 ? diff : 0
        }
      }
      endAt = startAt.add(trainingDuration, 'minute').set('millisecond', 0)
    }

    const updateData = {
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString()
    }

    if (auction.type === 'sealed-bid') {
      updateData.created_at = startAt.toISOString()
    }

    await supabase.from('auctions').update(updateData).eq('id', auctionId)

    // For prebid-enabled auctions: bots are triggered via webhook when user places first prebid
    // For non-prebid auctions: bots are triggered via webhook when user places first live bid

    return { success: true, message: 'Auction reset successfully' }
  } else {
    return { success: false, message: 'Auction is not training' }
  }
})
