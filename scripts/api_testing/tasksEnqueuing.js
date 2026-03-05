import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

async function engineCall() {
  console.log('Engine called for auction')
  const auctionId = '4e5a3265-9ce1-4ca8-9a00-798cf7d90da7'

  try {
    const { data: bids, error: errorBids } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (errorBids) {
      console.log(`Error fetching bids for ${auctionId}`)
    }
    const lastBid = bids[0]
    console.log('lastBid: ', lastBid)
    const response = await fetch('http://localhost:3000/api/addBidToWatchQueue', {
      method: 'POST',
      body: JSON.stringify({ record: lastBid }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Response:', data)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

engineCall()
