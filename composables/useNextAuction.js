export default function () {
  const supabase = useSupabaseClient()

  async function getNextAuction(currentAuction) {
    // Fetching all possible next auctions
    const { data: nextAuctionsData } = await supabase
      .from('auctions')
      .select('id, lot_number, start_at, end_at, type, usage, created_at')
      .match({
        auctions_group_settings_id: currentAuction.value.auctions_group_settings_id
      })
      .order('lot_number')

    // Handle null result from query
    const nextAuctions = nextAuctionsData || []

    // Enrich auctions with their status.
    nextAuctions.forEach((auction) => {
      const startAt =
        auction.type === 'sealed-bid' && auction.usage !== 'training'
          ? auction.created_at
          : auction.start_at
      auction.status = getAuctionStatus(startAt, auction.end_at, auction.type)
    })

    // Filter open auctions
    const openAuctions = nextAuctions.filter((a) => a.status.label !== 'closed')

    // Find next open auction
    const nextAuction = openAuctions.find((auction) => {
      return auction.lot_number > currentAuction.lot_number
    })

    // Return next open auction or first open auction
    return nextAuction || openAuctions[0]
  }

  return { getNextAuction }
}
