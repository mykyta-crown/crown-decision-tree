import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

console.log('Checking bids table schema...\n')

// Get one bid to see all columns
const { data: bids } = await supabase.from('bids').select('*').limit(1)

if (bids && bids.length > 0) {
  console.log('Available columns in bids table:')
  Object.keys(bids[0]).forEach((col) => {
    console.log(`  - ${col}`)
  })
}

process.exit(0)
