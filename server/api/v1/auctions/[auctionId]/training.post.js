import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import { captureApiError } from '~/server/utils/sentry/captureApiError'
import { BOT_EMAILS } from '~/server/utils/bots'

dayjs.extend(duration)

function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

export default defineEventHandler(async (event) => {
  try {
    const { auctionId } = getRouterParams(event)

    // Fetch auction data and related entities in parallel for better performance
    const [{ data: auction }, { data: sellers }, { data: auctionSupplies }, { data: bids }] =
      await Promise.all([
        fetchAuction(auctionId),
        supabase.from('auctions_sellers').select('*').eq('auction_id', auctionId),
        supabase.from('supplies').select('id, quantity').eq('auction_id', auctionId),
        supabase.from('bids').select('*').eq('auction_id', auctionId)
      ])

    const bots = sellers.filter((seller) => BOT_EMAILS.includes(seller.seller_email))

    const { data: botsProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in(
        'email',
        bots.map((seller) => seller.seller_email)
      )
      .order('email', { ascending: true })

    // Fetch supplies_sellers for bot ceiling prices
    const { data: botSuppliesSellers } = await supabase
      .from('supplies_sellers')
      .select('*')
      .in(
        'seller_email',
        botsProfiles.map((p) => p.email)
      )
      .in(
        'supply_id',
        auctionSupplies.map((s) => s.id)
      )

    // Helper: get a bot's ceiling for a specific supply (per-unit)
    const getBotCeiling = (botEmail, supplyId) => {
      const ss = botSuppliesSellers?.find(
        (s) => s.seller_email === botEmail && s.supply_id === supplyId
      )
      return ss?.ceiling || 0
    }

    // Helper: get a bot's total ceiling (sum of ceiling * quantity across all supplies)
    const getBotTotalCeiling = (botEmail) => {
      return auctionSupplies.reduce((total, supply) => {
        return total + getBotCeiling(botEmail, supply.id) * supply.quantity
      }, 0)
    }

    // Separate all bids into user and bot bids
    const userBids = bids
      .filter((bid) => {
        return !botsProfiles.find((profile) => profile.id === bid.seller_id)
      })
      .sort((a, b) => a.price - b.price)

    const botsBids = bids
      .filter((bid) => {
        return botsProfiles.find((profile) => profile.id === bid.seller_id)
      })
      .sort((a, b) => a.price - b.price)

    const bestUserPrice = userBids[0]?.price
    const bestBotsPrice = botsBids[0]?.price

    // Check if bots have already placed their initial prebids
    // We check for any bot prebids (type='prebid') since restart deletes all bids
    // If prebids exist, bots have already done their initial placement
    const botPrebids = botsBids.filter((bid) => bid.type === 'prebid')
    const botsHavePlacedInitialBids = botPrebids.length > 0

    if (auction.usage === 'training' || auction.usage === 'test') {
      // Handle bot behavior for Dutch auctions (including Preferred Dutch)
      if (auction.type === 'dutch' || auction.type === 'preferred-dutch') {
        const maxNbRounds = Math.ceil(auction.duration / auction.overtime_range)
        const maxPrice = auction.max_bid_decr
        // Valid price range matches builder/chart: round 0 (startingPrice) to round N-1 (maxPrice)
        const startingPrice = maxPrice - (maxNbRounds - 1) * auction.min_bid_decr

        // Step 1 (prebid enabled only): Wait for user to place their first prebid before bots place prebids
        // This ensures the user is always rank #1 at the start of training
        if (auction.dutch_prebid_enabled && !bestUserPrice) {
          return { success: true, message: 'Waiting for user to place first prebid' }
        }

        // Step 2 (prebid enabled only): ALL bots place prebid at round 10 (0-based index 9) if no bot prebids exist yet
        if (auction.dutch_prebid_enabled && !botsHavePlacedInitialBids) {
          // Wait 1 second to ensure user's prebid is recorded first
          await wait(1000)

          // Target round 10 (0-based index 9), clamped to the last available round
          const prebidRoundIndex = Math.min(9, maxNbRounds - 1)

          const roundPrice = maxPrice - (maxNbRounds - prebidRoundIndex - 1) * auction.min_bid_decr

          // Create prebids for ALL invited bots, skip if price is outside valid range
          const botPrebids = botsProfiles
            .map((botProfile) => {
              if (roundPrice > maxPrice || roundPrice < startingPrice) return null
              return {
                price: roundPrice,
                seller_id: botProfile.id,
                seller_email: botProfile.email,
                auction_id: auctionId,
                type: 'prebid'
              }
            })
            .filter(Boolean)

          if (botPrebids.length > 0) {
            await supabase.from('bids').insert(botPrebids)
          }

          return {
            success: true,
            message: `${botsProfiles.length} bot prebids placed at round ${prebidRoundIndex + 1}`
          }
        }

        // Step 3: Only BOT 1 places live bid
        // For prebid-enabled: triggered via webhook when user bids during the auction, bot bids at round 5
        // For prebid-disabled: triggered via 10s interval, bot reacts once user places first live bid
        const elapsedTime = dayjs.duration(dayjs().diff(dayjs(auction.start_at)))
        const currentRound = Math.floor(elapsedTime.asMinutes() / auction.overtime_range)

        // When prebid is disabled, require auction to have started
        // (the 10s interval calls this before start_at, producing negative rounds)
        if (!auction.dutch_prebid_enabled && currentRound < 0) {
          return { success: true, message: 'Waiting for auction to start (no prebid mode)' }
        }

        // Target round 5 (0-based index 4), clamped to the last available round
        const liveBidRound = Math.min(4, maxNbRounds - 1)

        // Check if we're at or past the target round and bot 1 hasn't placed a live bid yet
        const { data: botLiveBids } = await supabase
          .from('bids')
          .select('*')
          .eq('auction_id', auctionId)
          .eq('seller_id', botsProfiles[0].id)
          .eq('type', 'bid')

        if (currentRound >= liveBidRound && (!botLiveBids || botLiveBids.length === 0)) {
          // Wait 5 seconds before placing the live bid
          await wait(5000)

          // Re-fetch auction to check if it was reset during the wait
          const { data: freshAuction } = await fetchAuction(auctionId)
          const freshStatus = auctionStatus({
            startAt: freshAuction.start_at,
            endAt: freshAuction.end_at
          })
          if (freshStatus !== 'active') {
            return { success: true, message: 'Auction no longer active after wait (likely reset)' }
          }

          // Re-check if bot 1 has already placed a live bid (prevents race conditions
          // when multiple calls to training endpoint happen simultaneously)
          const { data: botLiveBidsAfterWait } = await supabase
            .from('bids')
            .select('id')
            .eq('auction_id', auctionId)
            .eq('seller_id', botsProfiles[0].id)
            .eq('type', 'bid')

          if (botLiveBidsAfterWait && botLiveBidsAfterWait.length > 0) {
            return { success: true, message: 'Bot 1 already placed live bid (checked after wait)' }
          }

          // Bid at target round price, capped at ceiling
          const roundPrice = maxPrice - (maxNbRounds - liveBidRound - 1) * auction.min_bid_decr
          const bot1Ceiling = getBotTotalCeiling(botsProfiles[0].email)
          const cappedLivePrice = bot1Ceiling > 0 ? Math.min(roundPrice, bot1Ceiling) : roundPrice

          // Only bot 1 places a live bid
          const botBid = {
            price: cappedLivePrice,
            seller_id: botsProfiles[0].id,
            seller_email: botsProfiles[0].email,
            auction_id: auctionId,
            type: 'bid'
          }

          await supabase.from('bids').insert(botBid)

          return { success: true, message: `Bot 1 live bid placed at round ${liveBidRound + 1}` }
        }

        return { success: true, message: 'No bot action needed at this round' }
      }

      if (auction.type === 'japanese') {
        // Japanese auction: Price DESCENDS (starts high, goes low)
        // Each bot places ONE prebid at their exit price (threshold)
        // Bots are MORE competitive (LOWER prices) than the user
        // so they can potentially win if user exits first
        // Bot 1: exits at user's price - 2 rounds (more competitive)
        // Bot 2: exits at user's price - 4 rounds (even more competitive)
        // Bot 3: exits at user's price - 6 rounds (most competitive)

        // Calculate ending price (lowest round price = last round in the auction)
        // Must match useJapaneseRounds.js / JapaneseLotRulesForm.vue formula
        const numberOfRounds = Math.ceil(auction.duration / auction.overtime_range)
        const endingPrice = auction.max_bid_decr - (numberOfRounds - 1) * auction.min_bid_decr

        // Check if bots have already placed prebids (prevent duplicates from race conditions)
        if (botsHavePlacedInitialBids) {
          return { success: true, message: 'Bots already placed prebids' }
        }

        // Step 1: Wait for user to place their first bid before bots place prebids
        // This ensures the user is always rank #1 at the start of training
        if (!bestUserPrice) {
          return { success: true, message: 'Waiting for user to place first bid' }
        }

        // Wait 1 second to ensure user's bid is recorded first
        await wait(1000)

        // Re-check if bots have placed prebids during the wait (prevents race conditions
        // when multiple user prebids trigger this endpoint simultaneously)
        const { data: botBidsAfterWait } = await supabase
          .from('bids')
          .select('id')
          .eq('auction_id', auctionId)
          .in(
            'seller_id',
            botsProfiles.map((p) => p.id)
          )
          .limit(1)

        if (botBidsAfterWait && botBidsAfterWait.length > 0) {
          return { success: true, message: 'Bots already placed prebids (checked after wait)' }
        }

        // Rounds BELOW user where each bot exits (more competitive)
        // Bot 1: -2 rounds, Bot 2: -4 rounds, Bot 3: -6 rounds, Bot 4: -8 rounds, Bot 5: -10 rounds
        const botExitRounds = [2, 4, 6, 8, 10]

        let prebidsPlaced = 0
        for (let botIndex = 0; botIndex < Math.min(5, botsProfiles.length); botIndex++) {
          // Calculate bot's exit price (LOWER than user = more competitive in descending auction)
          const botExitPrice = bestUserPrice - botExitRounds[botIndex] * auction.min_bid_decr

          // Only place prebid if exit price is within the valid auction range
          if (botExitPrice >= endingPrice && botExitPrice <= auction.max_bid_decr) {
            // Use insert_bid RPC to properly create bid_supplies entries
            // For Japanese auctions, use quantity: 1 because bids.price stores per-unit price
            // (insert_bid multiplies price * quantity, so we pass 1 to keep per-unit)
            const botEmail = botsProfiles[botIndex].email
            const bidSupplies = auctionSupplies.map((supply) => {
              return {
                supply_id: supply.id,
                price: botExitPrice,
                quantity: 1
              }
            })

            await supabase.rpc('insert_bid', {
              p_auction_id: auctionId,
              p_seller_id: botsProfiles[botIndex].id,
              p_supplies: bidSupplies,
              p_bid_type: 'prebid',
              p_handicaps: []
            })

            prebidsPlaced++
          }
        }

        return { success: true, message: `Bots placed ${prebidsPlaced} prebids after 3 seconds` }
      }

      if (auction.type === 'sealed-bid' && !bestBotsPrice) {
        const { data: supplies } = await supabase
          .from('bid_supplies')
          .select('*')
          .eq('bid_id', userBids[0].id)

        if (supplies.length > 0) {
          for (let botIndex = 0; botIndex < botsProfiles.length; botIndex++) {
            const botProfile = botsProfiles[botIndex]
            const bidSupplies = supplies.map((supply) => {
              const calculatedPrice = supply.price * (1 - (botIndex + 1) * 0.03)
              const ceiling = getBotCeiling(botProfile.email, supply.supply_id)
              const price = ceiling > 0 ? Math.min(calculatedPrice, ceiling) : calculatedPrice
              return {
                supply_id: supply.supply_id,
                price: price.toFixed(2),
                quantity: auctionSupplies.find((s) => s.id === supply.supply_id).quantity
              }
            })

            await supabase.rpc('insert_bid', {
              p_auction_id: auctionId,
              p_seller_id: botProfile.id,
              p_supplies: bidSupplies,
              p_bid_type: 'bid',
              p_handicaps: []
            })
          }

          return { success: true, message: 'Bots placed sealed bids' }
        }

        return { success: true, message: 'No user bid to respond to' }
      }

      if (auction.type === 'reverse') {
        // Step 1: Wait for user to place their first bid before bots place prebids
        // This ensures the user is always rank #1 at the start of training
        if (!bestUserPrice) {
          return { success: true, message: 'Waiting for user to place first bid' }
        }

        // Step 2: Bots place prebids HIGHER than user's bid so user starts rank 1
        // Each bot bids (botIndex+1) * 3% more expensive than the user
        if (!botsHavePlacedInitialBids) {
          // Wait 1 second to ensure user's bid is recorded first
          await wait(1000)

          // Get user's first bid supply breakdown to base bot prices on
          const { data: userBidSupplies } = await supabase
            .from('bid_supplies')
            .select('*')
            .eq('bid_id', userBids[0].id)

          for (let botIndex = 0; botIndex < botsProfiles.length; botIndex++) {
            const botProfile = botsProfiles[botIndex]
            const bidSupplies = userBidSupplies.map((supply) => {
              // Bots bid HIGHER than user so user starts rank 1 (lower price = better in reverse)
              const calculatedPrice = supply.price * (1 + (botIndex + 1) * 0.03)
              return {
                supply_id: supply.supply_id,
                price: Math.round(Math.max(calculatedPrice, 0)),
                quantity: auctionSupplies.find((s) => s.id === supply.supply_id).quantity
              }
            })

            await supabase.rpc('insert_bid', {
              p_auction_id: auctionId,
              p_seller_id: botProfile.id,
              p_supplies: bidSupplies,
              p_bid_type: 'prebid',
              p_handicaps: []
            })
          }

          return { success: true, message: 'Bots placed prebids above user price' }
        }

        // Step 3: Check if auction has started - bots only place live bids after start
        const now = dayjs()
        const auctionStart = dayjs(auction.start_at)
        if (now.isBefore(auctionStart)) {
          return {
            success: true,
            message: 'Auction not started yet, bots waiting to place live bids'
          }
        }

        // Step 4: Check if user is Rank 1 or tied (has the best or equal price)
        // User is Rank 1 if their best bid is lower than or equal to all bot bids
        // In training, bots should react even when tied to create competition
        const userIsRank1OrTied = bestUserPrice && bestUserPrice <= bestBotsPrice

        if (!userIsRank1OrTied) {
          return { success: true, message: 'Waiting for user to become Rank 1 or tied' }
        }

        // Step 5: Determine which "competition round" we're in based on bot bid counts
        // Count non-prebid bids from each bot
        const botBidCounts = botsProfiles.map((profile) => {
          return botsBids.filter((bid) => bid.seller_id === profile.id && bid.type === 'bid').length
        })

        // Determine the current round based on the minimum bot bid count
        const minBotBidCount = Math.min(...botBidCounts)

        // Check if we're in overtime (within 70% of overtime range from end)
        const endInDuration = dayjs(auction.end_at).diff(dayjs(), 'minutes', true)
        const isOvertime = endInDuration < auction.overtime_range * 0.7

        // Round 0: First competition round (bots 1-5 bid)
        // Normal rounds: bots 1-3 react, capped at 3 bids each
        // Overtime: bots 1-2 react, get 1 extra bid beyond the normal cap
        // The cap ensures the user can eventually beat the bots
        const normalCap = 3
        const overtimeCap = normalCap + 1
        let botsToActivate = []

        if (minBotBidCount === 0) {
          // First round: Bot 1-5 react (minimum 5 sec delay for natural behavior)
          botsToActivate = [
            { botIndex: 0, delay: 6000 }, // Bot 1: 6 sec
            { botIndex: 1, delay: 5000 }, // Bot 2: 5 sec
            { botIndex: 2, delay: 7000 }, // Bot 3: 7 sec
            { botIndex: 3, delay: 5000 }, // Bot 4: 5 sec
            { botIndex: 4, delay: 6000 } // Bot 5: 6 sec
          ]
            .filter((bot) => bot.botIndex < botsProfiles.length)
            .filter((bot) => botBidCounts[bot.botIndex] === 0)
        } else if (isOvertime) {
          // Overtime: Bot 1-2 react with 1 extra bid beyond normal cap
          botsToActivate = [
            { botIndex: 0, delay: 5000 }, // Bot 1: 5 sec
            { botIndex: 1, delay: 3000 } // Bot 2: 3 sec
          ].filter(
            (bot) => bot.botIndex < botsProfiles.length && botBidCounts[bot.botIndex] < overtimeCap
          )
        } else {
          // Normal rounds: Bot 1-3 react, capped at 3 bids each
          botsToActivate = [
            { botIndex: 0, delay: 5000 }, // Bot 1: 5 sec
            { botIndex: 1, delay: 5000 }, // Bot 2: 5 sec
            { botIndex: 2, delay: 3000 } // Bot 3: 3 sec
          ].filter(
            (bot) => bot.botIndex < botsProfiles.length && botBidCounts[bot.botIndex] < normalCap
          )
        }

        // Place bids for each activated bot with their respective delays
        for (const { botIndex, delay } of botsToActivate) {
          const botProfile = botsProfiles[botIndex]

          // Wait for the specified delay
          await wait(delay)

          // Re-check if this specific bot has already placed a bid (prevents race conditions
          // when multiple calls to training endpoint happen simultaneously)
          const { data: botBidsAfterWait } = await supabase
            .from('bids')
            .select('id')
            .eq('auction_id', auctionId)
            .eq('seller_id', botProfile.id)
            .eq('type', 'bid')

          const currentBotBidCount = botBidsAfterWait?.length || 0
          const expectedBidCount = botBidCounts[botIndex]

          if (currentBotBidCount > expectedBidCount) {
            // Another call already placed a bid for this bot, skip
            continue
          }

          // Re-fetch the current lowest bid (could be user or bot) after the delay
          // This ensures each bot bids 0.1% lower than the actual current lowest
          const { data: currentBids } = await supabase
            .from('bids')
            .select('id, price')
            .eq('auction_id', auctionId)
            .order('price', { ascending: true })
            .limit(1)

          const lowestBid = currentBids?.[0]
          if (!lowestBid) {
            continue
          }

          // Get the supplies from the lowest bid
          const { data: supplies } = await supabase
            .from('bid_supplies')
            .select('*')
            .eq('bid_id', lowestBid.id)

          // Calculate new price: random 0.1% to 0.3% lower than the current lowest bid
          const reductionPercent = 0.001 + Math.random() * 0.002 // Random between 0.1% and 0.3%
          const priceReduction = 1 - reductionPercent

          const bidSupplies = supplies.map((supply) => {
            const calculatedPrice = supply.price * priceReduction
            // Cap at ceiling per supply
            const ceiling = getBotCeiling(botProfile.email, supply.supply_id)
            const price = ceiling > 0 ? Math.min(calculatedPrice, ceiling) : calculatedPrice
            return {
              supply_id: supply.supply_id,
              price: Math.round(price),
              quantity: auctionSupplies.find((s) => s.id === supply.supply_id).quantity
            }
          })

          await supabase.rpc('insert_bid', {
            p_auction_id: auctionId,
            p_seller_id: botProfile.id,
            p_supplies: bidSupplies,
            p_bid_type: 'bid',
            p_handicaps: []
          })
        }

        return {
          success: true,
          message: `${botsToActivate.length} bots placed bids successfully`
        }
      }

      return { success: true, message: 'No bot action needed' }
    } else {
      return { success: false, message: 'Auction is not training' }
    }
  } catch (error) {
    console.error('Error in training endpoint:', {
      error: error.message,
      stack: error.stack,
      auctionId: event?.context?.params?.auctionId
    })

    // Capture error in Sentry with auction context
    await captureApiError(error, event, {
      operation: 'training_bot_action',
      auctionId: event?.context?.params?.auctionId,
      critical: true
    })

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message
    })
  }
})
