import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
dayjs.extend(utc)

function compareAttributes(obj1, obj2, attributes) {
  return attributes.every(
    (attr) => obj1.hasOwnProperty(attr) && obj2.hasOwnProperty(attr) && obj1[attr] === obj2[attr]
  )
}

function auctionStatus({ startAt, endAt }) {
  const startTime = dayjs.utc(startAt)
  const endTime = dayjs.utc(endAt)
  const currentDate = dayjs.utc()
  if (currentDate.isAfter(endTime)) {
    return 'closed'
  }
  if (currentDate.isAfter(startTime)) {
    return 'active'
  } else if (currentDate.isBefore(startTime)) {
    return 'upcoming'
  }
}

function maxNbRounds(totalDuration, roundDuration) {
  return Math.ceil(totalDuration / roundDuration) - 1
}

function calculateStartingPrice(endingPrice, maxRounds, amountPerRound) {
  const totalDecrease = maxRounds * amountPerRound
  const startingPrice = endingPrice - totalDecrease
  return Math.max(startingPrice, 0)
}

function headersHandler(headers) {
  if (!headers.authorization) {
    return {
      success: false,
      data: null,
      error: {
        ...ERROR_TYPES.UNAUTHORIZED,
        message: 'Missing authorization header',
        data: { receivedHeaders: headers }
      }
    }
  }

  if (
    headers.authorization !==
    'Bearer 1b6d37ddd7edc26729cbcf77ef0141818ed32fecd8dc5343f477f586fa709585'
  ) {
    return {
      success: false,
      data: null,
      error: {
        ...ERROR_TYPES.UNAUTHORIZED,
        message: 'Invalid bearer token',
        data: { receivedToken: headers.authorization }
      }
    }
  }
}

export { compareAttributes, auctionStatus, maxNbRounds, calculateStartingPrice, headersHandler }
