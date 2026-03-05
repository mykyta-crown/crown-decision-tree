import dayjs from 'dayjs'
import japMockTest from './japMockTest.js'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

const AUCTION_TEST = {
  start_at: dayjs().add(10, 'second').format('YYYY-MM-DD HH:mm:ssZZ'),
  end_at: dayjs().add(5, 'minute').format('YYYY-MM-DD HH:mm:ssZZ'),
  ...japMockTest
}
console.log('AUCTION_TEST: ', AUCTION_TEST)
const { data, error } = await supabase
  .from('auctions')
  .update({
    start_at: AUCTION_TEST.start_at,
    end_at: AUCTION_TEST.end_at
  })
  .eq('id', AUCTION_TEST.id)
if (error) {
  console.log('error: ', error)
}
//TODO: On update la start & enddate de l'auction

async function engineCall() {
  console.log('Emulate webhook INSERT auction')

  try {
    const response = await fetch('http://localhost:3000/api/v1/webhooks/auctions/insert', {
      method: 'POST',
      body: JSON.stringify({ record: AUCTION_TEST }),
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
    console.error('Error:', error)
  }
}

engineCall()
