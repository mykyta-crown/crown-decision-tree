import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

/**
 * Force an auction to end immediately by setting end_at to current time
 * @param {string} auctionId - UUID of the auction to end
 */
async function forceAuctionEnd(auctionId) {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('auctions')
    .update({ end_at: now })
    .eq('id', auctionId)
    .select()

  if (error) {
    console.error('Failed to force auction end:', error)
    process.exit(1)
  }
  console.log('Auction end time updated to:', now)
  console.log('Auction data:', data)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , auctionId] = process.argv
  if (!auctionId) {
    console.error('Usage: node forceAuctionEnd.js <auctionId>')
    process.exit(1)
  }
  forceAuctionEnd(auctionId).then(() => process.exit(0))
}
