import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { data: bid } = await supabase
    .from('bids')
    .select('*')
    .eq('id', 'eab2427c-b0b2-42f9-b93f-4c04f0d2409e')
    .single()
  const { data: auction } = await fetchAuction(bid.auction_id)

  const timeToCallAutoBid = dutchHelpers.calculateTimeToSchedule(auction, bid, -5)
})
