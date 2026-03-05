import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import durationPlugin from 'dayjs/plugin/duration'

dayjs.extend(durationPlugin)
dayjs.extend(relativeTime)

export default function (auctionRef) {
  const { now, status, start, end, duration } = useAuctionTimer(auctionRef)

  const maxNbRounds = computed(() => {
    return Math.ceil(auctionRef.value.duration / auctionRef.value.overtime_range)
  })
  const bestBid = computed(() => {
    const lowestBids = auctionRef.value.bids
      .sort((a, b) => dayjs(a.created_at) - dayjs(b.created_at))
      .reduce(
        (acc, bid) => {
          if (bid.price < acc.price) {
            return bid
          }
          return acc
        },
        { price: Infinity }
      )
    return lowestBids
  })

  const endDuration = computed(() => {
    if (status.value.label === 'closed') {
      return dayjs.duration(end.value.diff(start.value))
    } else {
      return dayjs.duration(now.value.diff(start.value))
    }
  })

  const nbPassedRounds = computed(() => {
    if (status.value.label === 'upcoming') return 0

    let passedRounds = 0
    if (status.value.label === 'closed') {
      passedRounds = Math.floor(duration.value.asMinutes() / auctionRef.value.overtime_range)
    } else {
      passedRounds = Math.floor(endDuration.value.asMinutes() / auctionRef.value.overtime_range)
    }

    if (status.value.label === 'closed') return Math.min(passedRounds, maxNbRounds.value)
    return passedRounds === maxNbRounds.value ? maxNbRounds.value - 1 : passedRounds
  })

  function getRoundStatus(roundIndex) {
    if (roundIndex < nbPassedRounds.value) {
      return 'passed'
    } else if (roundIndex === nbPassedRounds.value) {
      return 'active'
    } else {
      return 'inactive'
    }
  }

  const rounds = computed(() => {
    const maxPrice = auctionRef.value.max_bid_decr

    const quantity = auctionRef.value?.supplies[0]?.quantity
      ? auctionRef.value?.supplies[0]?.quantity
      : 1
    return Array.from({ length: maxNbRounds.value }, (r, i) => {
      const price = maxPrice - i * auctionRef.value.min_bid_decr
      return {
        index: i + 1,
        price,
        priceByUnit: price / quantity,
        status: getRoundStatus(i)
      }
    })
  })

  const activeRound = computed(() => {
    return rounds.value.find((r) => {
      return r.status === 'active'
    })
  })

  const startingPrice = computed(() => {
    return rounds.value[0]?.price || 0
  })

  const endingPrice = computed(() => {
    return rounds.value[rounds.value.length - 1]?.price || 0
  })

  const currentSupplies = computed(() => {
    return auctionRef.value?.supplies?.map((supply) => {
      let price = -1
      if (status.value.label === 'upcoming') {
        price = startingPrice.value
      } else if (status.value.label === 'active') {
        price = activeRound.value?.price
      } else if (status.value.label === 'closed') {
        price =
          rounds.value.find((r) => r.price === (bestBid.value?.price || r.price))?.price ||
          activeRound.value?.price
      }
      console.log('price', { ...supply, price })
      return { ...supply, price }
    })
  })
  console.log('currentSupplies', currentSupplies.value)

  return {
    startingPrice,
    endingPrice,
    maxNbRounds,
    nbPassedRounds,
    rounds,
    activeRound,
    currentSupplies,
    bestBid
  }
}
