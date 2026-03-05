import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { auctionId } = getRouterParams(event)
  const { sellerEmail } = getQuery(event)

  const query = supabase
    .from('auctions_handicaps')
    .select('id')
    .eq('auction_id', auctionId)
    .maybeSingle()

  if (sellerEmail) {
    query.eq('seller_email', sellerEmail)
  }
  const { data } = await query
  return data ? true : false
})
