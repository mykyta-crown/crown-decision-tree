import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(duration)

function maxNbRounds(totalDuration, roundDuration) {
  return Math.ceil(totalDuration / roundDuration) - 1
}

function calculateStartingPrice(endingPrice, maxRounds, amountPerRound) {
  const totalDecrease = maxRounds * (amountPerRound * 100)
  const startingPrice = (endingPrice * 100 - totalDecrease) / 100

  console.log(
    'calculateStartingPrice startingPrice: ',
    startingPrice,
    'totalDecrease: ',
    totalDecrease,
    'endingPrice: ',
    endingPrice,
    'amountPerRound: ',
    amountPerRound
  )
  return Math.max(startingPrice, 0)
}

// #TODO: This could be renamed. It's used only to find the time for the schedule, not for the actual round time.
function findRoundTime(
  startingPrice,
  startTime,
  maxRounds,
  roundDuration,
  pricePerRound,
  targetPrice
) {
  // Find which round corresponds to the target price
  let targetRound = null
  console.log(
    'startingPrice: ',
    startingPrice,
    'maxRounds: ',
    maxRounds,
    'roundDuration: ',
    roundDuration,
    'pricePerRound: ',
    pricePerRound,
    'targetPrice: ',
    targetPrice
  )
  for (let roundNum = 0; roundNum <= maxRounds; roundNum++) {
    const roundPrice = (startingPrice * 100 + pricePerRound * 100 * roundNum) / 100
    if (roundPrice === targetPrice) {
      targetRound = roundNum
      break
    }
  }
  // if (targetRound === 1) targetRound = 0
  console.log('targetRound: ', targetRound)
  if (targetRound === null) {
    return 'Price not found in any round'
  }

  // Calculate time elapsed until the start of the target round
  const timeElapsed = dayjs.duration(targetRound * roundDuration, 'minute')
  console.log('timeElapsed: ', timeElapsed.asSeconds())
  // Calculate the actual time of the round
  // #TODO: We need to schedule the task 5s before the round start so the actual task
  // can calculate the timeout before bid execution to the ms precision.
  const roundTime = dayjs(startTime).add(timeElapsed.asSeconds(), 'second')
  return roundTime.unix()
}

function getCurrentPrice(startTime, startingPrice, incrementAmount, roundDuration, maxPrice) {
  // Si l'auction n'a pas commencer. On renvoit le prix max ?
  if (!dayjs(startTime).isBefore(dayjs())) return maxPrice

  const startTimeMs = Math.trunc(+dayjs(startTime) / 1000) * 1000
  const currentTimeMs = +dayjs()

  const elapsedTime = currentTimeMs - startTimeMs

  // Si l'auction n'a pas commencer on renvoit le starting price ?
  // Ca me semble dangereux sur un prebid sur le premier round mais peu probable.
  if (elapsedTime < 0) {
    return startingPrice
  }

  const roundDurationMs = roundDuration * 60 * 1000
  const completedRounds = Math.floor(elapsedTime / roundDurationMs)
  console.log(
    'getCurrentPrice',
    startTimeMs,
    currentTimeMs,
    elapsedTime,
    roundDurationMs,
    elapsedTime / roundDurationMs,
    completedRounds
  )
  const currentPrice = (startingPrice * 100 + completedRounds * (incrementAmount * 100)) / 100

  return currentPrice
}

function calculateTimeToBid(auction, bid, auctionSeller) {
  const maxRounds = maxNbRounds(auction.duration, auction.overtime_range)
  // console.log('maxRounds: ', maxRounds)
  const startingPrice = calculateStartingPrice(
    auction.max_bid_decr,
    maxRounds,
    auction.min_bid_decr
  )

  const timeToBid = findRoundTime(
    startingPrice,
    auction.start_at,
    maxRounds,
    auction.overtime_range,
    auction.min_bid_decr,
    bid.price
  )

  console.log(
    'timeToBid UNIX: ',
    timeToBid,
    'timeToBid: ',
    dayjs.unix(timeToBid).format('YYYY-MM-DD HH:mm:ss')
  )

  let delayBeforeBid = 0

  if (auctionSeller.time_per_round) {
    const roundDuration = auction.overtime_range * 60

    if (auctionSeller.time_per_round < roundDuration) {
      delayBeforeBid = roundDuration - auctionSeller.time_per_round
    }
  }
  console.log('delayBeforeBid: ', delayBeforeBid)

  const timeToBidWithDealy = timeToBid + delayBeforeBid
  console.log(
    'timeToBidWithDealy UNIX: ',
    timeToBidWithDealy,
    'timeToBidWithDealy: ',
    dayjs.unix(timeToBidWithDealy).format('YYYY-MM-DD HH:mm:ss')
  )

  return timeToBidWithDealy
}

function isPriceValid(auction, bid) {
  const maxRounds = maxNbRounds(auction.duration, auction.overtime_range)
  const startingPrice = calculateStartingPrice(
    auction.max_bid_decr,
    maxRounds,
    auction.min_bid_decr
  )
  const currentRoundPrice = getCurrentPrice(
    auction.start_at,
    startingPrice,
    auction.min_bid_decr,
    auction.overtime_range,
    auction.max_bid_decr
  )

  console.log('isPriceValid', currentRoundPrice, bid.price)

  return currentRoundPrice === bid.price
}

export const dutchHelpers = {
  maxNbRounds,
  calculateStartingPrice,
  findRoundTime,
  getCurrentPrice,
  calculateTimeToBid,
  isPriceValid
}
