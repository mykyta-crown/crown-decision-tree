import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(duration)

//Unrelated info: on dutch it's the ending price is max_bid_decr
//We also have on the auction the starting price(max_bid_decr)
//and price decrement on each round (min_bid_decr).

//TODO: Need to document each field depending on the type of auction

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
      previousPrice: round === 0 ? null : currentPrice + auction.min_bid_decr,
      nextPrice: round === numberOfRounds - 1 ? null : currentPrice - auction.min_bid_decr,
      duration: auction.overtime_range // in minutes
    })

    currentPrice -= auction.min_bid_decr
  }

  return rounds
}

export { generateAuctionRounds }

export const japaneseHelpers = {
  generateAuctionRounds
}
