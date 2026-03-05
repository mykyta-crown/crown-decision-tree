async function fetchAuction(auctionId) {
  const { data: auction, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', auctionId)
    .single()

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        ...ERROR_TYPES.DATABASE_ERROR,
        message: `Error fetching auction ${auctionId}: ${error.message}`
      }
    }
  }

  if (!auction) {
    return {
      success: false,
      data: null,
      error: {
        ...ERROR_TYPES.NOT_FOUND,
        message: `No auction found with id ${auctionId}`
      }
    }
  }

  return { success: true, data: auction, error: null }
}

export { fetchAuction }
