import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

// OFFICIAL REAL AUCTION ID
// const AUCTION_ID = '209ccbff-31b7-45a8-8d69-d5e90532bf00'
// const SUPPLY_ID = '8f27579a-86ac-4bff-9d02-85d7d7c234f7'

const AUCTION_ID = 'da78b99e-f045-4cec-83e8-2dfb38c286e4'
const SUPPLY_ID = 'b87c5943-508f-476a-b276-59fc38c905a7'

// const EMAIL = 'korte@grondmetpowder.de'
// const EMAIL = ' kyrylo.antonovych@treibacher.com'
//const EMAIL = 'buchholz.sebastian@cronimet.de'
//const EMAIL =  'richard.oliver@metalpowdergroup.com'

const EMAIL = 'supplier+2@crown.ovh'

const UNIT_PRICE = 20

const { data: profiles } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .eq('email', EMAIL)

const profile = profiles[0]

console.log('profile: ', profile)

const { data: bids, error: bidsError } = await supabase
  .from('bids')
  .insert([
    {
      auction_id: AUCTION_ID,
      seller_id: profile.id,
      price: UNIT_PRICE * 5000,
      type: 'bid'
    }
  ])
  .select()

const bidId = bids[0].id
console.log('Bid ID: ', bidId)

await supabase
  .from('bid_supplies')
  .insert({
    price: UNIT_PRICE,
    supply_id: SUPPLY_ID,
    bid_id: bidId
  })
  .select()

console.log('Bid inserted.')
