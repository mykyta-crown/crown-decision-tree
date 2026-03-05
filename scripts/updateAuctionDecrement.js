import { createClient } from '@supabase/supabase-js'
import dayjs from 'dayjs'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

/**
 * Update min and max bid decrement for a given auction.
 * @param {string} auctionId - UUID of the auction to modify.
 * @param {number} minDecr - New minimum decrement.
 * @param {number} maxDecr - New maximum decrement.
 */
async function updateDecrement(auctionId, minDecr, maxDecr) {
  const { data, error } = await supabase
    .from('auctions')
    .update({ min_bid_decr: minDecr, max_bid_decr: maxDecr })
    .eq('id', auctionId)
    .select()

  if (error) {
    console.error('Failed to update auction:', error)
    process.exit(1)
  }
  console.log('Auction updated:', data)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , auctionId, minStr, maxStr] = process.argv
  if (!auctionId || !minStr || !maxStr) {
    console.error('Usage: node updateAuctionDecrement.js <auctionId> <minDecrement> <maxDecrement>')
    process.exit(1)
  }
  const min = parseFloat(minStr)
  const max = parseFloat(maxStr)
  updateDecrement(auctionId, min, max).then(() => process.exit(0))
}
