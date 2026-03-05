//scenario: tous le monde les 2 premiers rounds
// supplier 4 et 5 ne bid pas le 3ieme
// supplier 3 ne bid pas le 4
// supplier 2 ne bid pas le 5
//

// npm run emulateBid 1,2
//
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import utc from 'dayjs/plugin/utc.js'
import japMockTest from './japMockTest.js'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

dayjs.extend(utc)
dayjs.extend(duration)

//TODO: On fetch l'auction par l'id de la Mock

// const AUCTION_TEST = {
//   'start_at': dayjs().add(10, 'second').format('YYYY-MM-DD HH:mm:ssZZ'),
//   'end_at': dayjs().add(10, 'second').add(5, 'minute').format('YYYY-MM-DD HH:mm:ssZZ'),
//   ...japMockTest
// }
console.log('japMockTest.id: ', japMockTest.id)
const { data: AUCTION_TEST } = await supabase
  .from('auctions')
  .select('*')
  .eq('id', japMockTest.id)
  .single()
console.log('AUCTION_TEST: ', AUCTION_TEST)

function generateAuctionRounds(auction) {
  const startTime = dayjs.utc(auction.start_at)
  const roundDuration = dayjs.duration(auction.overtime_range, 'minutes')
  const totalDuration = dayjs.duration(auction.duration, 'minutes')
  const numberOfRounds = Math.floor(totalDuration.asMinutes() / roundDuration.asMinutes())
  console.log(
    `Auction setup: Start time: ${startTime.format()}, Round duration: ${roundDuration.asMinutes()}min, Total duration: ${totalDuration.asMinutes()}min, Number of rounds: ${numberOfRounds}`
  )

  const rounds = []
  let currentPrice = auction.max_bid_decr // Starting price

  for (let round = 0; round < numberOfRounds; round++) {
    const roundStartAt = startTime.add(roundDuration.asMinutes() * round, 'minute')
    const roundEndAt = roundStartAt.add(roundDuration.asMinutes(), 'minute')

    rounds.push({
      round: round + 1,
      start_at: roundStartAt.toISOString(),
      end_at: roundEndAt.toISOString(),
      price: currentPrice,
      duration: auction.overtime_range // in minutes
    })

    // Decrease price for next round
    currentPrice -= auction.min_bid_decr
  }

  return rounds
}

const SUPPLIERS_MAP = {
  SUP1: '399363ce-3335-4330-878f-6e8c96ef9611',
  SUP2: '1fc52aa7-499a-4b48-a766-3c39c1442206',
  SUP3: '96b95aee-4f0f-469b-a9c2-9098e62269bb',
  SUP4: 'e51e5cb7-7649-4d03-82eb-447a7cec2eb0',
  SUP5: '85fa11ec-2a8f-40a1-b779-ceb8ecfe5e07'
}

async function emulateBids(auctionId, supplierIds, bidsPrice) {
  console.log('supplierIds:', supplierIds)
  console.log('bidsPrice:', bidsPrice)
  const suppliersBids = supplierIds.map((e) => ({
    price: bidsPrice,
    auction_id: auctionId,
    type: 'bid',
    seller_id: SUPPLIERS_MAP['SUP' + e]
  }))
  console.log('suppliersBids: ', suppliersBids)
  await supabase.from('bids').insert(suppliersBids)
}

function findCurrentRound(plannedRounds) {
  const now = dayjs()
  console.log(
    '-----------------now: ',
    now.format('YYYY-MM-DD HH:mm:ssZZ'),
    '---- First round start at: ',
    dayjs(plannedRounds[0].start_at).format('YYYY-MM-DD HH:mm:ssZZ')
  )
  const currentRound = plannedRounds.find((round) => {
    const startTime = dayjs(round.start_at)
    const endTime = dayjs(round.end_at)
    // console.log('Round startTime: ', startTime, ' endTime: ', endTime)
    return now.isAfter(startTime) && now.isBefore(endTime)
  })
  return currentRound
}

const args = process.argv.slice(2)
console.log('args: ', args)
const supplierIds = args[0].split(',').map(Number)
const plannedRounds = generateAuctionRounds(AUCTION_TEST)
console.log('plannedRounds: ', plannedRounds)
//TODO: on veux trouver ou on se trouve dans les rounds par rapport a la date actuel
const currentRound = findCurrentRound(plannedRounds)
console.log('currentRound: ', currentRound)
emulateBids(AUCTION_TEST.id, supplierIds, currentRound.price)
