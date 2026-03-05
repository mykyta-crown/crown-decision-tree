import dayjs from 'dayjs'
import durationPlugin from 'dayjs/plugin/duration.js'

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

dayjs.extend(durationPlugin)

const buyerId = '3b1659ea-e446-4133-b9da-fd7ef4879a46'
const companyId = '3834159a-27c9-4b10-9655-480a37c0bb50'

const startDate = dayjs('2024-03-15T15:40')
const endDate = dayjs('2024-03-15T16:10')
const duration = dayjs.duration(endDate.diff(startDate))

const description =
  'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...'

const { data: auctions, error: auctionError } = await supabase
  .from('auctions')
  .insert([
    {
      buyer_id: buyerId,
      company_id: companyId,
      start_at: startDate.format(),
      end_at: endDate.format(),
      duration: duration.as('minutes'),
      description,
      overtime_range: 2,
      max_bid_decr: 20,
      min_bid_decr: 0.25,
      log_visibility: 'own_rank_only',
      currency: 'EUR',
      name: 'TEST ' + dayjs().format('MM-DD HH:mm'),
      baseline: 20000
    }
  ])
  .select()

console.log('Auctions', auctions, auctionError)

const auction = auctions[0]

const suplies = [
  {
    name: 'Iron',
    quantity: 10000,
    unit: 'kg'
  }
]

suplies.forEach((s) => {
  s.auction_id = auction.id
})

const { data: insertedSuplies } = await supabase.from('supplies').insert(suplies).select()

const emails = ['fabien@quantedsquare.com', 'josiane@yopmail.com']

const { data: sellers } = await supabase.from('auctions_sellers').insert(
  emails.map((email) => {
    return {
      seller_email: email,
      auction_id: auction.id,
      terms_accepted: true
    }
  })
)

// Optional Make a bunch of bids
async function createBids(email) {
  const { data: profiles } = await supabase.from('profiles').select('*').eq('email', email)

  const sellerId = profiles[0].id
  const nbBids = 5
  const baseSupliePrice = 20000

  for (let index = 0; index < nbBids; index++) {
    const bidSuplies = insertedSuplies.map((supply) => {
      return {
        supply_id: supply.id,
        price: Math.round(baseSupliePrice * ((100 - (index + Math.random())) * 0.01))
      }
    })

    const price = bidSuplies.reduce((total, supply) => {
      return total + supply.price
    }, 0)

    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .insert({
        auction_id: auction.id,
        seller_id: sellerId,
        created_at: dayjs()
          .add(index + Math.random(), 'minutes')
          .format(),
        price,
        rank: 1
      })
      .select()

    console.log(bids, bidsError)

    const bid = bids[0]

    bidSuplies.forEach((s) => {
      s.bid_id = bid.id
    })

    await supabase.from('bid_supplies').insert(bidSuplies)
  }
}

emails.forEach((email) => {
  createBids(email)
})
