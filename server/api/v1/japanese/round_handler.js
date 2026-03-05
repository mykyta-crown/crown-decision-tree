import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import duration from 'dayjs/plugin/duration.js'
import { captureCloudTaskError } from '~/server/utils/sentry/captureApiError'

dayjs.extend(utc)
dayjs.extend(duration)

//TODO: Ajouter les bearer token
//TODO: On cherche a savoir au moment de la fin d'un round qui / combien sont encore en lice (= on un bid au price du round en cours)
//TODO: Reflechir au cas de l'update - voir si besoin d'un double check du round en cours et ne pas ce fier a 100% au info de round fourni par le scheduler
//TODO: Double check - si un meme gars bid en missant un round, il est consideré comme au niveau du min de la suite de round consecutive
// il n'est pas possible de rebid après avoir loupé un round

async function updateAuctionEndTime(auctionId, endTime) {
  const { error } = await supabase.from('auctions').update({ end_at: endTime }).eq('id', auctionId)

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        ...ERROR_TYPES.DATABASE_ERROR,
        message: `Error updating auction end time: ${error.message}`,
        data: { auctionId, endTime }
      }
    }
  }

  return {
    success: true,
    data: { auctionId, endTime },
    error: null
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    console.log('Entering RoundHandler')

    // Log Cloud Tasks request source
    const headers = getRequestHeaders(event)
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
    const userAgent = headers['user-agent'] || 'unknown'
    const cloudTasksQueue = headers['x-cloudtasks-queuename'] || 'not-from-cloud-tasks'
    const cloudTasksTaskName = headers['x-cloudtasks-taskname'] || 'unknown'

    console.log('[CLOUD TASKS REQUEST - JAPANESE]', {
      ip,
      userAgent,
      cloudTasksQueue,
      cloudTasksTaskName,
      timestamp: new Date().toISOString()
    })

    const { type, auction: scheduleAuction, round } = body

    const { data: auction, error: errorFetchAuction } = await fetchAuction(scheduleAuction.id)

    if (errorFetchAuction) {
      throw createError({
        statusCode: errorFetchAuction.statusCode,
        message: errorFetchAuction.message
      })
    }

    if (auction.type !== 'japanese') {
      // We don't send an error because we don't want the job to retry.
      console.log('Auction is not Japanese type:', auction.type)
      return {
        statusCode: 200,
        message: 'Auction is not a Japanese auction'
      }
    }

    if (!body?.type || !body?.auction || !body?.round) {
      throw createError({
        ...ERROR_TYPES.INVALID_INPUT,
        data: { receivedBody: body }
      })
    }

    console.log('Round Checked: ', round)

    if (type !== 'round') {
      throw createError({
        ...ERROR_TYPES.INVALID_TASK_TYPE,
        message: 'Invalid task type for Japanese auction round handler',
        data: {
          expectedType: 'round',
          receivedType: type
        }
      })
    }

    //TODO: faire la gestion d'erreur ici
    const status = auctionStatus({ startAt: auction.start_at, endAt: auction.end_at })
    if (status !== 'active') {
      console.log('Auction is not started or is closed.')
      return { success: false, message: 'Auction is not started or is closed.' }
    }

    // console.log(`Round ${JSON.stringify(round)} for auction ${auction.id} has ${activeBids.length} active bids`)

    const { data: previousBids, error } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auction.id)
      .eq('price', round.previousPrice)
    // .eq('type', 'bid')
    console.log(
      `With prvious price at ${round.previousPrice} Bids: ${JSON.stringify(previousBids)}`
    )

    const { data: afterPrebids, error: prebidsError } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auction.id)
      .eq('type', 'prebid')
      .eq('price', round.price)

    // To stop auction :
    // Check if previous round only got one bid
    // And if the current round got no more prebids so we go all down to the last prebid listed
    if (error || prebidsError) {
      return {
        success: false,
        data: null,
        error: {
          ...ERROR_TYPES.DATABASE_ERROR,
          message: `Error fetching bids for auction ${auction.id}: ${error.message}`
        }
      }
    }
    console.log(
      'previousBids: ',
      JSON.stringify(previousBids),
      'afterPrebids: ',
      JSON.stringify(afterPrebids)
    )

    // Japanese auction end logic:
    // The auction ends when only ONE participant remains active
    // In descending auctions, a participant is active if their LOWEST bid is at or BELOW the current round price
    // Each seller's competitive price is their lowest (most aggressive) bid

    // Get the lowest bid for each seller
    const { data: allBids, error: bidsError } = await supabase
      .from('bids')
      .select('seller_id, seller_email, price, type, created_at')
      .eq('auction_id', auction.id)
      .order('price', { ascending: true })

    console.log('\n========================================')
    console.log(`[DEBUG Round ${round.round}] ROUND HANDLER EXECUTION`)
    console.log('========================================')
    console.log(`Auction ID: ${auction.id}`)
    console.log(`Round number: ${round.round}`)
    console.log(`Round price: ${round.price}`)
    console.log(`Previous price: ${round.previousPrice}`)
    console.log(`Round start_at: ${round.start_at}`)
    console.log(`Max rank displayed: ${auction.max_rank_displayed}`)

    if (bidsError) {
      console.error(`[ERROR] Failed to fetch bids:`, bidsError)
    }

    console.log(`\n[BIDS] Fetched ${allBids?.length || 0} bids:`)
    if (allBids && allBids.length > 0) {
      allBids.forEach((bid, index) => {
        console.log(
          `  ${index + 1}. seller_id=${bid.seller_id?.substring(0, 8)}... email=${bid.seller_email || 'NULL'} price=${bid.price} type=${bid.type}`
        )
      })
    } else {
      console.log('  ⚠️  NO BIDS FOUND!')
    }

    // Group bids by seller and get their lowest (most competitive) bid
    // Store both seller_email (for auctions_sellers lookup) and lowest price
    const sellerLowestBids = {}
    if (allBids) {
      for (const bid of allBids) {
        if (!sellerLowestBids[bid.seller_id] || bid.price < sellerLowestBids[bid.seller_id].price) {
          sellerLowestBids[bid.seller_id] = {
            price: bid.price,
            seller_email: bid.seller_email
          }
        }
      }
    }

    console.log(`\n[GROUPING] Grouped into ${Object.keys(sellerLowestBids).length} unique sellers:`)
    Object.entries(sellerLowestBids).forEach(([sellerId, data]) => {
      console.log(
        `  seller_id=${sellerId.substring(0, 8)}... email=${data.seller_email || 'NULL'} lowest_price=${data.price}`
      )
    })

    // Count sellers whose lowest bid is at or below the PREVIOUS round price (still active)
    // We use previousPrice to give sellers a chance to manually bid at the current round
    // before being considered inactive. This prevents premature auction ending.
    const activeCheckPrice = round.previousPrice || round.price
    const activeSellers = Object.entries(sellerLowestBids).filter(
      ([sellerId, sellerData]) => sellerData.price <= activeCheckPrice
    )

    console.log(
      `\n[ACTIVE SELLERS] Filtering: price <= ${activeCheckPrice} (previousPrice used to give time for live-bids)`
    )
    console.log(`Result: ${activeSellers.length} active sellers`)
    if (activeSellers.length > 0) {
      activeSellers.forEach(([sellerId, data]) => {
        console.log(
          `  ✅ seller_id=${sellerId.substring(0, 8)}... email=${data.seller_email || 'NULL'} price=${data.price} (${data.price} <= ${activeCheckPrice})`
        )
      })
    } else {
      console.log('  ⚠️  NO ACTIVE SELLERS!')
    }

    // Identify eliminated sellers (those whose lowest bid is above PREVIOUS round price)
    // We use previousPrice because at round start, we're checking who didn't confirm the previous round
    // This gives sellers a chance to manually confirm at the current round price before being eliminated
    // Skip elimination on first round (no previousPrice) - sellers need time to place their prebids
    const eliminatedSellers = round.previousPrice
      ? Object.entries(sellerLowestBids).filter(
          ([sellerId, sellerData]) => sellerData.price > round.previousPrice
        )
      : []

    console.log(
      `Active sellers at price ${round.price}: ${activeSellers.length}`,
      activeSellers.map(([id, data]) => ({
        seller_id: id,
        seller_email: data.seller_email,
        lowest_bid: data.price
      }))
    )
    console.log(
      `Eliminated sellers (didn't confirm previous price ${round.previousPrice}): ${eliminatedSellers.length}`,
      eliminatedSellers.map(([id, data]) => ({
        seller_id: id,
        seller_email: data.seller_email,
        lowest_bid: data.price
      }))
    )

    // Mark eliminated sellers with exit_time if they don't have one already
    if (eliminatedSellers.length > 0) {
      for (const [sellerId, sellerData] of eliminatedSellers) {
        // Check if seller already has exit_time
        const { data: auctionSeller } = await supabase
          .from('auctions_sellers')
          .select('exit_time, seller_email')
          .eq('auction_id', auction.id)
          .eq('seller_email', sellerData.seller_email)
          .single()

        // Only set exit_time if not already set
        if (auctionSeller && !auctionSeller.exit_time) {
          await supabase
            .from('auctions_sellers')
            .update({ exit_time: round.start_at })
            .eq('auction_id', auction.id)
            .eq('seller_email', sellerData.seller_email)

          console.log(
            `Marked seller ${sellerId} (${sellerData.seller_email}) as exited at round ${round.price}`
          )
        }
      }
    }

    // End auction when NO participants remain active (all eliminated)
    const isFirstRound = round.round === 1
    // Note: Japanese No-Rank auctions (max_rank_displayed = 0) do NOT auto-terminate
    // because sellers cannot see if they are the last remaining participant.
    // The buyer must manually end the auction in No-Rank mode.
    // Also skip round 1 - participants need time to place their prebids
    //
    // IMPORTANT: The auction does NOT end when only 1 supplier remains!
    // The last supplier must continue confirming each round (via prebid or live bid)
    // until they stop confirming. This ensures they go down to their lowest prebid
    // price (or even lower if they continue live bidding).
    const hasBidsPlaced = Object.keys(sellerLowestBids).length > 0
    // End condition: 0 active sellers but bids were placed (all eliminated, last one to confirm wins)
    const endCondition = activeSellers.length === 0 && hasBidsPlaced

    console.log(`\n[END CONDITION CHECK]`)
    console.log(`  isFirstRound: ${isFirstRound} (round.round === 1)`)
    console.log(
      `  hasBidsPlaced: ${hasBidsPlaced} (${Object.keys(sellerLowestBids).length} sellers have bid)`
    )
    console.log(
      `  activeCheckPrice: ${activeCheckPrice} (using previousPrice to give time for live-bids)`
    )
    console.log(
      `  endCondition: ${endCondition} (activeSellers: ${activeSellers.length}, need 0 with bids placed to end)`
    )
    console.log(
      `  eliminatedSellers: ${eliminatedSellers.length} (didn't confirm previous price ${round.previousPrice})`
    )
    console.log(`  max_rank_displayed: ${auction.max_rank_displayed} (must be > 0 to auto-end)`)
    console.log(
      `  Will end auction: ${endCondition && auction.max_rank_displayed > 0 && !isFirstRound}`
    )

    // Only end if:
    // 1) activeSellers === 0 (no one confirmed the previous round price)
    // 2) max_rank_displayed > 0 (not no-rank)
    // 3) not first round
    if (endCondition && auction.max_rank_displayed > 0 && !isFirstRound) {
      console.log(`\n🛑 ENDING AUCTION - No participants confirmed at price ${round.previousPrice}`)
      console.log('========================================\n')
      const { success: updateSuccess, error: updateError } = await updateAuctionEndTime(
        auction.id,
        round.start_at
      )

      if (!updateSuccess) {
        throw createError({
          ...updateError,
          data: { auctionId: auction.id, endTime: round.start_at }
        })
      }

      console.log(
        `Auction ${auction.id} ended in round ${round}. Only ${activeSellers.length} participant(s) remaining. End time set to ${round.start_at}`
      )

      return {
        success: true,
        data: {
          message: `Auction ${auction.id} ended - only ${activeSellers.length} participant(s) remaining`,
          auctionId: auction.id,
          roundNumber: round,
          endTime: round.start_at,
          remainingParticipants: activeSellers.length,
          winningSeller: activeSellers[0]?.[0]
        }
      }
    }

    // For training auctions only, also check if auction should end
    // This allows No-Rank trainings to end when:
    // 1. All sellers have manually exited (exit_time set), OR
    // 2. All sellers have been implicitly eliminated (no active bids at current price)
    const isTrainingAuction = auction.usage === 'training'
    const isNoRank = !(auction.max_rank_displayed > 0)
    if (isTrainingAuction && !isNoRank && !isFirstRound && hasBidsPlaced) {
      // Check if all sellers have exit_time set
      const { data: allAuctionSellers } = await supabase
        .from('auctions_sellers')
        .select('exit_time, seller_email')
        .eq('auction_id', auction.id)

      const allSellersExited =
        allAuctionSellers &&
        allAuctionSellers.length > 0 &&
        allAuctionSellers.every((s) => s.exit_time !== null)

      // Also check if all sellers have been implicitly eliminated (no active sellers left)
      const allSellersEliminated = activeSellers.length === 0

      console.log(
        `\n[TRAINING CHECK] All sellers exited: ${allSellersExited}, All sellers eliminated: ${allSellersEliminated}`
      )

      if (allSellersExited || allSellersEliminated) {
        const reason = allSellersExited ? 'all_sellers_exited' : 'all_sellers_eliminated'
        console.log(`\n🛑 ENDING TRAINING AUCTION - ${reason}`)
        console.log('========================================\n')
        const { success: updateSuccess, error: updateError } = await updateAuctionEndTime(
          auction.id,
          round.start_at
        )

        if (!updateSuccess) {
          throw createError({
            ...updateError,
            data: { auctionId: auction.id, endTime: round.start_at }
          })
        }

        return {
          success: true,
          data: {
            message: `Training auction ${auction.id} ended - ${reason}`,
            auctionId: auction.id,
            roundNumber: round,
            endTime: round.start_at,
            reason
          }
        }
      }
    }

    console.log(`\n✅ AUCTION CONTINUES - ${activeSellers.length} participants still active`)
    console.log('========================================\n')

    return {
      success: true,
      data: {
        message: `Round ${round} for auction ${auction.id} completed with ${previousBids.length} active bids`,
        auctionId: auction.id,
        roundNumber: round,
        activeBidsCount: previousBids.length
      }
    }
  } catch (error) {
    console.error('Error in japaneseAuctionRound:', {
      error: error.message,
      stack: error.stack,
      data: {
        auctionId: body?.auction?.id,
        round: body?.round
      }
    })

    // Capture error in Sentry with Cloud Task context
    await captureCloudTaskError(
      error,
      {
        auctionId: body?.auction?.id,
        type: 'japanese_round',
        round: body?.round
      },
      {
        headers: getRequestHeaders(event)
      }
    )

    if (error.statusCode) {
      throw error
    }

    throw createError({
      ...ERROR_TYPES.INTERNAL_ERROR,
      data: {
        auctionId: body?.auction?.id,
        round: body?.round
      }
    })
  }
})
