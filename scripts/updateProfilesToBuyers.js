import { createClient } from '@supabase/supabase-js'
import _ from 'lodash'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

async function update() {
  const { data: auctions } = await supabase
    .from('auctions')
    .select('id, buyer_id')
    .eq('usage', 'real')

  const buyers = _.uniq(auctions.map((auction) => auction.buyer_id))

  console.log('buyers', buyers.length)

  await supabase
    .from('profiles')
    .update({
      role: 'buyer'
    })
    .eq('admin', false)
    .in('id', buyers)
}

update()
