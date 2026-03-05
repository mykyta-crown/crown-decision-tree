import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

// Calculate the date 2 months ago
const twoMonthsAgo = new Date()
twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
const twoMonthsAgoISO = twoMonthsAgo.toISOString()

// First, count the auctions that will be affected
const { count: auctionsCount, error: countError } = await supabase
  .from('auctions')
  .select('*', { count: 'exact', head: true })
  .eq('usage', 'test')
  .lt('created_at', twoMonthsAgoISO)

if (countError) {
  console.error('Error counting auctions:', countError)
  process.exit(1)
}

console.log(`Found ${auctionsCount} auctions that will be marked as deleted`)

// Prompt for confirmation
console.log(
  'Do you want to proceed with the update? (Run the script again without the count check)'
)
process.exit(0)

// Update query (commented out for safety)
/*
const { data, error } = await supabase.from('auctions')
  .update({ deleted: true })
  .eq('usage', 'test')
  .lt('created_at', twoMonthsAgoISO);

if (error) {
  console.error('Error updating auctions:', error);
} else {
  console.log('Successfully marked old test auctions as deleted');
  console.log('Number of auctions updated:', data?.length || 0);
}
*/
