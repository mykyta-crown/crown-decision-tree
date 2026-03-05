import dayjs from 'dayjs'
import supabase from '~/server/utils/supabase'
import { dutchHelpers } from './helpers.js'
import { enqueueTask, deleteTask } from '~/server/utils/enqueuer.js'
import { ERROR_TYPES } from '~/server/utils/errors.js'

async function dutchAddPreBidToScheduler(auction, bid, oidcToken = null) {
  try {
    console.log('auction: ', auction.id, ' -- bid: ', bid.id)
    // Fetch the latest bid from DB to get cloud_task
    const { data: dbBid, error: dbBidError } = await supabase
      .from('bids')
      .select('cloud_task, profiles(email)')
      .eq('id', bid.id)
      .single()

    if (dbBidError) {
      throw new Error(`Failed to fetch bid: ${dbBidError.message}`)
    }

    if (!dbBid || !dbBid.profiles || !dbBid.profiles.email) {
      throw new Error(`Bid ${bid.id} has no associated profile email`)
    }

    console.log('dbBid.profiles', dbBid.profiles)

    const { data: auctionSeller, error: auctionSellerError } = await supabase
      .from('auctions_sellers')
      .select('*')
      .eq('auction_id', auction.id)
      .eq('seller_email', dbBid.profiles.email)
      .single()

    if (auctionSellerError) {
      throw new Error(`Failed to fetch auction_seller: ${auctionSellerError.message}`)
    }

    if (!auctionSeller) {
      throw new Error(
        `No auction_seller found for auction ${auction.id} and email ${dbBid.profiles.email}`
      )
    }

    console.log('auction_seller', auctionSeller)

    // If there is an existing cloud_task, delete it
    if (dbBid && dbBid.cloud_task) {
      await deleteTask(dbBid.cloud_task, oidcToken)
    }

    const timeToBid = dutchHelpers.calculateTimeToBid(auction, bid, auctionSeller)
    const timeToCallAutoBid = timeToBid - 5

    console.log(
      'TIME TO SCHEDULE: ',
      timeToCallAutoBid,
      dayjs.unix(timeToCallAutoBid).format('YYYY-MM-DD HH:mm:ss')
    )
    console.log(`[${auction.id}] - Enqueueing bid for Auction ${auction.id}`)

    const result = await enqueueTask(bid, timeToCallAutoBid, 'DUTCH', oidcToken)
    if (!result.success) {
      return {
        success: false,
        error: result.error
      }
    }
    // Update the bid row with the new task name
    const { error: updateError } = await supabase
      .from('bids')
      .update({ cloud_task: result.data.taskName })
      .eq('id', bid.id)

    if (updateError) {
      console.error('Error updating bid with cloud_task:', updateError)
      // Don't throw here, the task was created successfully
    }

    return {
      success: true,
      data: {
        bid,
        scheduledTime: timeToCallAutoBid,
        taskName: result.data.taskName
      }
    }
  } catch (error) {
    console.error('Error in addPreBidToScheduler:', {
      error: error.message,
      auctionId: auction?.id,
      bidId: bid?.id
    })

    return {
      success: false,
      error: {
        ...ERROR_TYPES.INTERNAL_ERROR,
        message: 'Failed to schedule bid',
        data: { auctionId: auction?.id, bidId: bid?.id }
      }
    }
  }
}

export { dutchAddPreBidToScheduler }
