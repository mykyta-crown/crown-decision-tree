import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

/**
 * Enable rank_per_line_item flag for an auction
 * @param {string} auctionId - UUID of the auction
 */
async function enableRankPerLineItem(auctionId) {
  const { data, error } = await supabase
    .from('auctions')
    .update({ rank_per_line_item: true })
    .eq('id', auctionId)
    .select()

  if (error) {
    console.error('Failed to enable rank_per_line_item:', error)
    process.exit(1)
  }

  console.log('✅ rank_per_line_item enabled for auction:', auctionId)
  console.log('Auction data:', data[0])
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , auctionId] = process.argv
  if (!auctionId) {
    console.error('Usage: node enable_rank_per_line_item.js <auctionId>')
    process.exit(1)
  }
  enableRankPerLineItem(auctionId).then(() => process.exit(0))
}
