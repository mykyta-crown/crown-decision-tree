import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import durationPlugin from 'dayjs/plugin/duration'

dayjs.extend(durationPlugin)
dayjs.extend(relativeTime)

export default function (auctionRef, bidsRef = null) {
  const { now, status, start, end, duration } = useAuctionTimer(auctionRef)

  const maxNbRounds = computed(() => {
    return Math.ceil(auctionRef.value.duration / auctionRef.value.overtime_range)
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

    // For closed Dutch auctions: cap at the winning bid's round
    // (end_at may have been set after the winning bid due to race conditions)
    if (status.value.label === 'closed') {
      const allBids = bidsRef?.value || auctionRef.value?.bids || []
      const winningBid = allBids
        .filter((b) => b.type === 'bid')
        .sort((a, b) => a.price - b.price || new Date(a.created_at) - new Date(b.created_at))[0]

      if (winningBid) {
        const bidTime = dayjs(winningBid.created_at)
        const startTime = dayjs(auctionRef.value.start_at)
        const bidDurationMinutes = dayjs.duration(bidTime.diff(startTime)).asMinutes()
        const cappedPassedRounds = Math.ceil(bidDurationMinutes / auctionRef.value.overtime_range)
        passedRounds = Math.min(passedRounds, cappedPassedRounds)
      }
    }

    return passedRounds >= maxNbRounds.value ? maxNbRounds.value - 1 : passedRounds
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

    const quantity = auctionRef.value.supplies?.[0]?.quantity || 1

    return Array.from({ length: maxNbRounds.value }, (r, i) => {
      const price = maxPrice - (maxNbRounds.value - i - 1) * auctionRef.value.min_bid_decr
      return {
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
        price = activeRound.value?.price
      }

      return { ...supply, price }
    })
  })

  return {
    startingPrice,
    endingPrice,
    maxNbRounds,
    nbPassedRounds,
    rounds,
    activeRound,
    currentSupplies,
    status
  }
}
