import { createClient } from '@supabase/supabase-js'

// import auctionData from './Data/WeldingAlloys/24-05-21_HC_Ferro_Chromium.json' with {type: 'json'}
import auctionData from './Data/WeldingAlloys/24-05-21_Cobalt_Powder.json' with { type: 'json' }
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

const { data: auctions } = await supabase.from('auctions').insert([auctionData.auction]).select()

const auction = auctions[0]

const suplies = auctionData.supplies

const { data: insertedSuplies } = await supabase
  .from('supplies')
  .insert(
    suplies.map((supply) => {
      const { name, quantity, unit } = supply
      return { name, quantity, unit, auction_id: auction.id }
    })
  )
  .select()

const suppliers = auctionData.suppliers

const emails = suppliers.map((s) => s.email)

const { data: sellers } = await supabase.from('auctions_sellers').insert(
  emails.map((email) => {
    return {
      seller_email: email,
      auction_id: auction.id,
      terms_accepted: false
    }
  })
)

suppliers.forEach(async (supplier) => {
  const { data: profiles } = await supabase.from('profiles').select('*').eq('email', supplier.email)
  const sellerId = profiles[0].id

  const price = insertedSuplies.reduce((total, supply) => {
    const supplierSupply = supplier.supplies.find((s) => s.name === supply.name)
    return total + supplierSupply.price * supply.quantity
  }, 0)

  const { data: bids, error } = await supabase
    .from('bids')
    .insert([
      {
        auction_id: auction.id,
        seller_id: sellerId,
        price,
        type: 'ceiling'
      }
    ])
    .select()

  console.log(error)

  const bid = bids[0]

  const bidSuplies = insertedSuplies.map((supply) => {
    const supplierSupply = supplier.supplies.find((s) => s.name === supply.name)

    return {
      supply_id: supply.id,
      bid_id: bid.id,
      price: supplierSupply.price
    }
  })

  await supabase.from('bid_supplies').insert(bidSuplies)
})
