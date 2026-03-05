// Debug script to check the data structure
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

const auctionId = '377311af-da37-45db-9564-b8e0ee8c0eba'

async function debugLineItemData() {
  console.log('🔍 Debugging line-item ranking data\n')

  // Get auction with supplies
  const { data: auction } = await supabase
    .from('auctions')
    .select('*, supplies(*)')
    .eq('id', auctionId)
    .single()

  console.log('📦 Auction supplies:', auction.supplies.length)
  auction.supplies.forEach((s) => console.log(`   - ${s.name} (id: ${s.id})`))

  // Get sellers
  const { data: sellers } = await supabase
    .from('auctions_sellers')
    .select('*')
    .eq('auction_id', auctionId)

  console.log('\n👥 Sellers:', sellers.length)
  sellers.forEach((s) => console.log(`   - ${s.seller_email}`))

  // Get all bids
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('price')

  console.log('\n💰 All bids:', bids.length)
  bids.forEach((b) => {
    console.log(`   - Seller: ${b.seller_id}, Supply: ${b.supply_id}, Price: ${b.price}`)
  })

  // Get profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .in(
      'id',
      sellers.map((s) => s.seller_id)
    )

  console.log('\n📋 Profiles:', profiles.length)
  profiles.forEach((p) => {
    const companyName = p.companies ? p.companies.name : 'No company'
    console.log(`   - ${p.email} (${companyName}) - ID: ${p.id}`)
  })

  // Check rank structure
  console.log('\n🏆 Checking ranks:')
  for (const profile of profiles) {
    for (const supply of auction.supplies) {
      const supplierBids = bids.filter(
        (b) => b.seller_id === profile.id && b.supply_id === supply.id
      )
      if (supplierBids.length > 0) {
        console.log(`   - ${profile.email} on ${supply.name}: ${supplierBids.length} bid(s)`)
        supplierBids.forEach((bid) => {
          console.log(`      Price: ${bid.price}, Bid ID: ${bid.id}`)
        })
      }
    }
  }
}

debugLineItemData().then(() => process.exit(0))
