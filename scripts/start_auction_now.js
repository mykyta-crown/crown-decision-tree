import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

/**
 * Start an auction immediately
 * @param {string} auctionId - UUID of the auction
 */
async function startAuctionNow(auctionId) {
  const now = new Date()
  const endTime = new Date(now.getTime() + 30 * 60 * 1000) // +30 minutes

  const { data, error } = await supabase
    .from('auctions')
    .update({
      start_at: now.toISOString(),
      end_at: endTime.toISOString()
    })
    .eq('id', auctionId)
    .select()

  if (error) {
    console.error('Failed to start auction:', error)
    process.exit(1)
  }

  console.log('✅ Auction started!')
  console.log('   Start:', now.toISOString())
  console.log('   End:', endTime.toISOString())
  console.log('   Duration: 30 minutes')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , auctionId] = process.argv
  if (!auctionId) {
    console.error('Usage: node start_auction_now.js <auctionId>')
    process.exit(1)
  }
  startAuctionNow(auctionId).then(() => process.exit(0))
}
