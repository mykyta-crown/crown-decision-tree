import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

async function engineCall() {
  console.log('Engine called for auction')

  const bidToTest = {
    id: '09cc981f-0167-4541-aa93-818d3e6b233c',
    auction_id: '4e5a3265-9ce1-4ca8-9a00-798cf7d90da7'
  }
  try {
    const response = await fetch('http://localhost:3000/api/v1/dutch/auto_bid', {
      method: 'POST',
      body: JSON.stringify(bidToTest),
      headers: {
        'Content-Type': 'content/json'
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
