import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import { captureCloudTaskError } from '~/server/utils/sentry/captureApiError'

dayjs.extend(duration)
//TODO: Ajouter les bearer token

async function autoBid(auction, bid) {
  try {
    console.log(`[DUTCH AUTO_BID] Starting autoBid for auction ${auction.id}, bid ${bid.id}`)
    console.log(
      `[DUTCH AUTO_BID] Bid price: ${bid.price}, Auction start: ${auction.start_at}, end: ${auction.end_at}`
    )

    // Check if the auction is active
    const status = auctionStatus({
      auctionId: auction.id,
      startAt: auction.start_at,
      endAt: auction.end_at
    })
    console.log(`[DUTCH AUTO_BID] Auction status: ${status}`)
    if (status !== 'active') {
      console.log(`[DUTCH AUTO_BID] ❌ Auction not active, returning early`)
      return { success: false, message: 'Auction is not started or is closed.' }
    }

    // Check if a winning bid already exists (another seller already accepted the price)
    const { data: existingWinningBid } = await supabase
      .from('bids')
      .select('id, seller_email')
      .eq('auction_id', bid.auction_id)
      .eq('type', 'bid')
      .limit(1)
      .maybeSingle()

    if (existingWinningBid) {
      console.log(
        `[DUTCH AUTO_BID] ❌ A winning bid already exists (id=${existingWinningBid.id}, seller=${existingWinningBid.seller_email}), aborting`
      )
      return {
        success: false,
        message: 'A winning bid already exists for this auction.'
      }
    }

    // Check if prebid price matches current round price
    const isPriceValid = dutchHelpers.isPriceValid(auction, bid)
    console.log(`[DUTCH AUTO_BID] isPriceValid: ${isPriceValid}`)
    if (!isPriceValid) {
      console.log(`[DUTCH AUTO_BID] ❌ Price not valid, returning early`)
      return { success: false, message: 'Running price is not the same as the prebid price.' }
    }

    // Get the lowest bid (winner candidate) - only consider prebids, not already converted bids
    const { data: lowestBid, error: errorLowestBid } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', bid.auction_id)
      .eq('type', 'prebid') // Only consider prebids, not already converted bids
      .order('price', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (errorLowestBid) {
      console.error(`[DUTCH AUTO_BID] ❌ Error fetching lowestBid:`, errorLowestBid)
      return { success: false, message: `Error fetching lowestbid for ${auction.id}` }
    }

    console.log(`[DUTCH AUTO_BID] Lowest prebid: id=${lowestBid.id}, price=${lowestBid.price}`)
    console.log(`[DUTCH AUTO_BID] Current bid: id=${bid.id}, price=${bid.price}`)
    console.log(
      `[DUTCH AUTO_BID] Match check: price match=${bid.price === lowestBid.price}, id match=${bid.id === lowestBid.id}`
    )

    if (bid.price === lowestBid.price && bid.id === lowestBid.id) {
      console.log(`[DUTCH AUTO_BID] ✅ This prebid is the winner! Converting to bid...`)
      const { id, created_at, updated_at, type, ...endBidData } = lowestBid
      const endBid = { ...endBidData, type: 'bid' }

      const { data: insertedBid, error: insertError } = await supabase
        .from('bids')
        .insert(endBid)
        .select()
        .single()

      if (insertError) {
        console.error(`[DUTCH AUTO_BID] ❌ Error inserting bid:`, insertError)
        await captureCloudTaskError(new Error(`Failed to insert bid: ${insertError.message}`), {
          auctionId: auction.id,
          bidId: bid.id,
          type: 'dutch_autobid_insert_failed'
        })
        return { success: false, message: `Error inserting bid: ${insertError.message}` }
      }

      console.log(`[DUTCH AUTO_BID] ✅ Bid inserted successfully:`, insertedBid?.id)

      // End training auction immediately after winning bid is placed (only for serial timing)
      if (auction.usage === 'training' && auction.auctions_group_settings_id) {
        // Check timing rule to avoid affecting parallel auctions
        const { data: groupSettings } = await supabase
          .from('auctions_group_settings')
          .select('timing_rule')
          .eq('id', auction.auctions_group_settings_id)
          .single()

        // Only end early for serial timing (parallel auctions have independent timing)
        if (groupSettings?.timing_rule === 'serial') {
          console.log(`[DUTCH AUTO_BID] 🛑 Ending training auction immediately (serial timing)`)
          const { error: updateError } = await supabase
            .from('auctions')
            .update({ end_at: new Date().toISOString() })
            .eq('id', auction.id)

          if (updateError) {
            console.error(`[DUTCH AUTO_BID] Error ending training auction:`, updateError)
          }
        }
      }

      return { success: true, data: { bidId: insertedBid?.id, message: 'Bid placed successfully' } }
    } else {
      console.log(`[DUTCH AUTO_BID] ℹ️ This prebid is not the winner (another prebid has priority)`)
      return { success: true, message: 'Not the winning prebid' }
    }
  } catch (error) {
    console.error('[DUTCH AUTO_BID] ❌ Error in autoBid:', error)
    await captureCloudTaskError(error, {
      auctionId: auction.id,
      bidId: bid.id,
      type: 'dutch_autobid'
    })
    return { success: false, error: error.message }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default defineEventHandler(async (event) => {
  let legacyBid = null
  try {
    const body = await readBody(event)
    legacyBid = body

    console.log(`[DUTCH AUTO_BID HANDLER] ========================================`)
    console.log(`[DUTCH AUTO_BID HANDLER] Cloud Task received for bid ${legacyBid.id}`)
    console.log(`[DUTCH AUTO_BID HANDLER] Timestamp: ${new Date().toISOString()}`)

    const { data: auction } = await fetchAuction(legacyBid.auction_id)

    if (!auction) {
      console.log(`[DUTCH AUTO_BID HANDLER] ❌ Auction not found`)
      return { success: false, message: 'Auction does not exist anymore' }
    }

    if (auction.type !== 'dutch') {
      console.log(`[DUTCH AUTO_BID HANDLER] ❌ Not a Dutch auction (type: ${auction.type})`)
      return {
        statusCode: 200,
        message: 'Auction is not a Dutch auction'
      }
    }

    const { data: bid, error: errorBid } = await supabase
      .from('bids')
      .select('*, profiles(email)')
      .eq('id', legacyBid.id)
      .single()

    if (errorBid) {
      console.error('[DUTCH AUTO_BID HANDLER] ❌ Error fetching bid:', errorBid)
      return { success: false, message: `Error fetching bid for ${legacyBid.id}` }
    }
    if (!bid) {
      console.log(`[DUTCH AUTO_BID HANDLER] ❌ Bid not found`)
      return { success: false, message: 'Bid does not exist anymore.' }
    }
    if (bid && bid.type !== 'prebid') {
      console.log(`[DUTCH AUTO_BID HANDLER] ❌ Bid already converted (type: ${bid.type})`)
      return { success: false, message: 'Bid exist but is not a prebid anymore.' }
    }

    // Check if bid has a profile with email
    if (!bid.profiles || !bid.profiles.email) {
      console.error('[DUTCH AUTO_BID HANDLER] ❌ Bid has no profile or email:', {
        bidId: bid.id,
        profiles: bid.profiles,
        seller_email: bid.seller_email
      })
      // Use seller_email from bid as fallback
      if (!bid.seller_email) {
        return { success: false, message: 'Bid has no associated profile or seller_email' }
      }
    }

    // Use seller_email from bid directly, fallback to profiles.email
    const sellerEmail = bid.seller_email || bid.profiles?.email

    const { data: auctionSeller } = await supabase
      .from('auctions_sellers')
      .select('*')
      .eq('auction_id', auction.id)
      .eq('seller_email', sellerEmail)
      .single()

    const exactBidTime = dutchHelpers.calculateTimeToBid(auction, bid, auctionSeller)
    const nowTimestamp = +dayjs()
    const timeToWait = exactBidTime * 1000 - nowTimestamp

    console.log(`[DUTCH AUTO_BID HANDLER] Bid price: ${bid.price}`)
    console.log(
      `[DUTCH AUTO_BID HANDLER] Exact bid time: ${dayjs.unix(exactBidTime).format('YYYY-MM-DD HH:mm:ss')}`
    )
    console.log(`[DUTCH AUTO_BID HANDLER] Now: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`)
    console.log(
      `[DUTCH AUTO_BID HANDLER] Time to wait: ${timeToWait}ms (${(timeToWait / 1000).toFixed(1)}s)`
    )

    if (timeToWait > 0) {
      console.log(`[DUTCH AUTO_BID HANDLER] Waiting ${timeToWait}ms before executing...`)
      await delay(timeToWait + 1)
    } else {
      console.log(
        `[DUTCH AUTO_BID HANDLER] ⚠️ Cloud Task arrived late (${Math.abs(timeToWait)}ms), executing immediately`
      )
    }

    const ret = await autoBid(auction, bid)
    console.log(`[DUTCH AUTO_BID HANDLER] Result:`, ret)
    console.log(`[DUTCH AUTO_BID HANDLER] ========================================`)
    return ret
  } catch (error) {
    console.error('Error in AutoBid:', error)

    // Capture error in Sentry with Cloud Task context
    await captureCloudTaskError(
      error,
      {
        auctionId: legacyBid?.auction_id,
        bidId: legacyBid?.id,
        type: 'dutch_autobid'
      },
      {
        headers: getRequestHeaders(event)
      }
    )

    return { success: false, error: error.message }
  }
})
