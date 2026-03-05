//TODO: Faire la gestion d'erreur
export async function updatePreBidsToScheduler(auction, oldAuction, oidcToken = null) {
  if (auction.type !== 'dutch' && auction.type !== 'japanese') {
    console.log(`The auction ${auction.id} is not a Dutch or a Japanese.`)
    return { success: false, message: `The auction ${auction.id} is not a Dutch.` }
  }

  const configToCompare = [
    'start_at',
    'end_at',
    'duration',
    'overtime_range',
    'max_bid_decr',
    'min_bid_decr',
    'log_visibility',
    'baseline',
    'type'
  ]

  console.log('auction: ', auction, '-- oldAuction: ', oldAuction)
  if (oldAuction && compareAttributes(auction, oldAuction, configToCompare)) {
    return { success: true, message: 'No param change on auction ' }
  }

  // Skip prebid rescheduling for Dutch auctions with prebid disabled
  if (auction.type === 'dutch' && !auction.dutch_prebid_enabled) {
    return { success: true, message: 'Dutch prebid disabled, no rescheduling needed' }
  }

  console.log('KEEP RUNING UPDATE PREBID')
  const { data: bids, error: errorBids } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auction.id)

  if (errorBids) {
    console.error('Error fetching bids:', errorBids)
    return { success: false, error: 'Failed to fetch bids' }
  }

  await Promise.all(
    bids.map(async (bid) => {
      try {
        const config = useRuntimeConfig()
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.webhookBearerToken}`
        }
        // Pass OIDC token if available
        if (oidcToken) {
          headers['x-vercel-oidc-token'] = oidcToken
        }

        const response = await $fetch('/api/v1/webhooks/bids/insert', {
          method: 'POST',
          headers,
          body: JSON.stringify({ record: bid })
        })

        return { bid: bid.id, success: true, response }
      } catch (error) {
        console.error(`Error processing bid ${bid.id}:`, error, error.toString())
        return { bid: bid.id, success: false, error: error.toString() }
      }
    })
  )

  return { success: true }
}
