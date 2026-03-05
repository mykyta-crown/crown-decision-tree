import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import utc from 'dayjs/plugin/utc.js'

import japMockTest from './japMockTest.js'
import { createClient } from '@supabase/supabase-js'

dayjs.extend(utc)
dayjs.extend(duration)
const supabase = createClient(
  'https://jgwbqdpxygwsnswtnrxf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnd2JxZHB4eWd3c25zd3RucnhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODgxMTg2OCwiZXhwIjoyMDI0Mzg3ODY4fQ.szliJfo9gfsOVSXuTj1BhN4ifvpA9G2ussQ4Czq5Bbc'
)

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

async function engineCall() {
  console.log('Emulate webhook INSERT auction')

  try {
    const { data: AUCTION_TEST } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', japMockTest.id)
      .single()
    console.log('AUCTION_TEST: ', AUCTION_TEST)
    const plannedRounds = generateAuctionRounds(AUCTION_TEST)
    console.log('plannedRounds: ', plannedRounds)
    //TODO: on veux trouver ou on se trouve dans les rounds par rapport a la date actuel
    const currentRound = findCurrentRound(plannedRounds)

    const response = await fetch('http://localhost:3000/api/v1/japanese/round_handler', {
      method: 'POST',
      body: JSON.stringify({ type: 'round', auction: AUCTION_TEST, round: currentRound }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('SEND')
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
