import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

/**
 * Update max_rank_displayed for an auction
 * @param {string} auctionId - UUID of the auction
 * @param {number} maxRank - Max rank to display
 */
async function updateMaxRankDisplayed(auctionId, maxRank) {
  const { data, error } = await supabase
    .from('auctions')
    .update({ max_rank_displayed: maxRank })
    .eq('id', auctionId)
    .select()

  if (error) {
    console.error('❌ Failed to update auction:', error)
    process.exit(1)
  }

  console.log('✅ Auction updated successfully!')
  console.log('ID:', data[0].id)
  console.log('Name:', data[0].name)
  console.log('max_rank_displayed:', data[0].max_rank_displayed)
  console.log('rank_per_line_item:', data[0].rank_per_line_item)
  console.log('Type:', data[0].type)

  return data[0]
}

// Run the script
const auctionId = process.argv[2]
const maxRank = parseInt(process.argv[3] || '2')

if (!auctionId) {
  console.error('Usage: node update_max_rank_displayed.js <auctionId> [maxRank]')
  process.exit(1)
}

updateMaxRankDisplayed(auctionId, maxRank)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
