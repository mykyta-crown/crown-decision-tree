import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

async function update() {
  const { data: oldCeilings } = await supabase
    .from('bids')
    .select('profiles(email), bid_supplies(supply_id, price)')
    .eq('type', 'ceiling')
  console.log('oldCeilings: ', oldCeilings)

  const formattedCeilings = oldCeilings.map((bid) => {
    return bid.bid_supplies.map((e) => ({
      seller_email: bid.profiles.email,
      supply_id: e.supply_id,
      ceiling: e.price,
      multiplier: 1
    }))
  })

  const ceilings = formattedCeilings.flat()
  console.log('Ceilings: ', ceilings)
  const { error } = await supabase.from('supplies_sellers').insert(ceilings)
  console.log('error: ', error)
}

update()
