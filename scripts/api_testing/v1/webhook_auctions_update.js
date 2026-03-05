import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

const auctionId = 'fe6b4a14-c4cb-4861-bce6-1fa78c032529'

const { data: auction } = await supabase.from('auctions').select('*').eq('id', auctionId).single()

const response = await fetch('http://localhost:3000/api/v1/webhooks/auctions/update', {
  method: 'POST',
  body: JSON.stringify({ record: auction }),
  headers: {
    'Content-Type': 'content/json',
    authorization: 'Bearer 1b6d37ddd7edc26729cbcf77ef0141818ed32fecd8dc5343f477f586fa709585'
  }
})

console.log(response)
