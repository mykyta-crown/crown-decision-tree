import dayjs from 'dayjs'
import durationPlugin from 'dayjs/plugin/duration.js'
import _ from 'lodash'

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

dayjs.extend(durationPlugin)

async function createAuction({
  buyerId,
  companyId,
  date,
  auctionDuration,
  overtimeRange,
  title,
  minBidDecr,
  test
}) {
  //TODO: Mettre emma - pour le moment Mykyta
  // const buyerId = '3b1659ea-e446-4133-b9da-fd7ef4879a46'
  //TODO: Mettre Welding alloy
  // const companyId = '3834159a-27c9-4b10-9655-480a37c0bb50'

  const startDate = dayjs(date)
  const endDate = startDate.add(auctionDuration, 'minute')
  const duration = dayjs.duration(endDate.diff(startDate))

  const description =
    'Ferro Molybdenum Powder 300BB0035AE - from June 20th to September 20th 2024 - 4*1000kg + 1000kg security stock '

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
        max_bid_decr_type: 'EUR',
        min_bid_decr_type: 'EUR',
        timezone: 'UTC+2',
        overtime_range: overtimeRange,
        max_bid_decr: 5,
        min_bid_decr: minBidDecr,
        log_visibility: 'own_rank_only',
        currency: 'EUR',
        name: title,
        baseline: 172500,
        test: test
      }
    ])
    .select()

  console.log('Auctions', auctions, auctionError)
}

async function giveCeilingToSupplier(auctionId, supplierEmail, lineItemPrice) {
  const suplies = [
    {
      name: 'Ferro Molybdenum Powder - 300BB0035AE',
      quantity: 5000,
      unit: 'Kilos'
    }
  ]

  const pricesMap = {
    'Ferro Molybdenum Powder - 300BB0035AE': lineItemPrice
  }

  suplies.forEach((s) => {
    s.auction_id = auctionId
  })

  const { data: insertedSuplies } = await supabase.from('supplies').insert(suplies).select()

  const emails = [
    supplierEmail,
    'supplier+1@crown.ovh',
    'supplier+2@crown.ovh',
    'supplier+3@crown.ovh'
  ]

  const { data: sellers } = await supabase.from('auctions_sellers').insert(
    emails.map((email) => {
      return {
        seller_email: email,
        auction_id: auctionId,
        terms_accepted: false
      }
    })
  )

  const prices = emails.map((email) => {
    const bidSuplies = insertedSuplies.map((supply) => {
      return {
        supply_id: supply.id,
        price: pricesMap[supply.name]
      }
    })

    const price = bidSuplies.reduce((total, supply) => {
      const initialSupp = insertedSuplies.find((e) => e.id === supply.supply_id)
      // console.log('initialSupp: ', (supply.price * initialSupp.quantity))
      return total + supply.price * initialSupp.quantity
    }, 0)

    return { email, bidSuplies, price }
  })

  // We need to create 1 pre bid for each
  async function createBids({ email, bidSuplies, price }, rank) {
    const { data: profiles } = await supabase.from('profiles').select('*').eq('email', email)
    const sellerId = profiles[0].id

    const { data: bids, error: bidsError } = await supabase
      .from('bids')
      .insert([
        {
          auction_id: auctionId,
          seller_id: sellerId,
          created_at: dayjs().format(),
          price,
          type: 'ceiling',
          rank
        }
      ])
      .select()

    console.log(bids, bidsError)

    const bid = bids[0]

    bidSuplies.forEach((s) => {
      s.bid_id = bid.id
    })

    await supabase.from('bid_supplies').insert(bidSuplies)
  }

  // console.log(orderBy(prices, 'price', 'asc'))

  _.orderBy(prices, 'price', 'asc').forEach((price, i) => {
    const rank = 2 // i + 1
    createBids(price, rank)
  })
}
//MYKYTA ID:
// 19e78e10-b84e-4a1e-bb7c-d381a5d6787a
//COMPANY MYKYTA ID:
// 3834159a-27c9-4b10-9655-480a37c0bb50

// REAL ONE
// await createAuction({
//   buyerId: '19e78e10-b84e-4a1e-bb7c-d381a5d6787a',
//   companyId: '3834159a-27c9-4b10-9655-480a37c0bb50',
//   date: '2024-05-07T10:00:00+02:00',
//   auctionDuration: 15,
//   overtimeRange: 3,
//   title: 'Ferro Molybdenum Powder',
//   minBidDecr: 0.15,
//   test: false
// })

// TEST ONE
// await createAuction({
//   buyerId: '19e78e10-b84e-4a1e-bb7c-d381a5d6787a',
//   companyId: '3834159a-27c9-4b10-9655-480a37c0bb50',
//   date: '2024-05-06T15:30:00+02:00',
//   auctionDuration: 7,
//   overtimeRange: 3,
//   title: '[TEST] Diff ceiling 5',
//   minBidDecr: 0.15,
//   test: true
// })

//34.50
// await giveCeilingToSupplier('9555f0a3-cf81-42fd-b447-00ffdc33e5cc', 'testbeforetest@yopmail.com', 20)

//Pour ajouter a la vrai auction
// await giveCeilingToSupplier('8179b7eb-5f30-40ff-a2c2-a559dbe80258', 'kyrylo.antonovych@treibacher.com', 34.50)
// await giveCeilingToSupplier('ea486321-1dd3-4b2c-8d4f-c29aecfc7a57', 'seb@crown.co', 34.50)

await giveCeilingToSupplier('11152bb8-5259-4294-affd-0e9c369c87a4', 'seb@crown.co', 34.5)

//REAL AUCTION ID: 209ccbff-31b7-45a8-8d69-d5e90532bf00

// 2290fd30-5835-4152-a6ad-c49b3999ff62
