import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

const auctionId = process.argv[2] || '377311af-da37-45db-9564-b8e0ee8c0eba'

const { data: bids, error } = await supabase
  .from('bids')
  .select('id, seller_id, supply_id, price, created_at')
  .eq('auction_id', auctionId)
  .order('created_at')

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log(`\n💰 Found ${bids.length} bids for auction ${auctionId}:\n`)
bids.forEach((bid, i) => {
  console.log(`${i + 1}. Bid ${bid.id.substring(0, 8)}...`)
  console.log(`   Seller: ${bid.seller_id}`)
  console.log(`   Supply: ${bid.supply_id || '❌ MISSING'}`)
  console.log(`   Price: ${bid.price}`)
  console.log(`   Created: ${bid.created_at}\n`)
})

if (bids.some((b) => !b.supply_id)) {
  console.log('⚠️  WARNING: Some bids are missing supply_id!')
  console.log('   Line-item ranking requires each bid to be associated with a supply.')
  console.log('   The bidding interface needs to set supply_id when placing bids.')
}

process.exit(0)
