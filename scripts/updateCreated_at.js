import { createClient } from '@supabase/supabase-js'
import _ from 'lodash'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

async function update() {
  const { data: firstAuctionsLot } = await supabase
    .from('auctions')
    .select('created_at, id, auctions_group_settings_id, lot_number, buyer_id')
    .range(0, 1000)
  const { data: secondAuctionsLot } = await supabase
    .from('auctions')
    .select('created_at, id, auctions_group_settings_id, lot_number, buyer_id')
    .range(1001, 2000)

  const concat = [...firstAuctionsLot, ...secondAuctionsLot]
  const filtered = concat.filter((auction) => auction.lot_number === 1)

  const upsertData = filtered.map((auction) => {
    return {
      id: auction.auctions_group_settings_id,
      created_at: auction.created_at,
      buyer_id: auction.buyer_id
    }
  })
  // const test = [{
  //   id: '88d28d87-4e34-4c30-bf47-f4bdd2fa6da4',
  //   created_at: '2024-06-11 18:36:22.571845+00',
  //   buyer_id: '01ce0721-587d-48b0-b2b7-fa7ca85cde6c'
  // }]
  // console.log('upsertData', upsertData)
  console.log('upsertData', upsertData.length)
  console.log('unique', _.uniqBy(upsertData, 'id').length)

  const uniqUpsertData = _.uniqBy(upsertData, 'id')
  const { data: returnData, error } = await supabase
    .from('auctions_group_settings')
    .upsert(uniqUpsertData)
    .select()

  console.log('returnData', returnData, error)
}

update()
