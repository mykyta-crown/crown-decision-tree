import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export default async function ({ auctionId, auctionGroupId }) {
  const askPrebid = {
    type: 'PrebidRequest',
    timestamp: Date.now()
  }

  const { user, isAdmin } = useUser()
  const { auction, rank } = await useUserAuctionBids({ auctionId })

  const { startingPrice, nbPassedRounds, rounds, activeRound } = useDutchRounds(auction)

  const {
    startingPrice: japaneseStartingPrice,
    nbPassedRounds: japaneseNbPassedRounds,
    rounds: japaneseRounds,
    activeRound: japaneseActiveRound
  } = useJapaneseRounds(auction)

  const { enrichBidWithTotalValue, bidsTotalValue } = await useTotalValue({ auctionId })

  const { status, end } = useAuctionTimer(auction)
  const { lastPrebidFromUser } = await useBids({ auctionId })

  const localLogs = ref([])

  const { getColors } = useColorSchema(auctionGroupId)
  const colorsMap = await getColors()

  // Pre-fetch seller ranks for Dutch auctions (used in EndingRank logic)
  const { fetchRank } = useRank()
  const sellerRanks = ref({}) // Map of seller_email -> rank
  if (auction.value?.type === 'dutch' && auction.value?.auctions_sellers?.length) {
    const rankPromises = auction.value.auctions_sellers.map(async (seller) => {
      const sellerId = seller.seller_profile?.id
      if (sellerId) {
        const rank = await fetchRank(sellerId, auctionId)
        return { email: seller.seller_email, rank }
      }
      return { email: seller.seller_email, rank: -1 }
    })
    const results = await Promise.all(rankPromises)
    const rankMap = {}
    results.forEach(({ email, rank }) => {
      rankMap[email] = rank
    })
    sellerRanks.value = rankMap
  }

  function rankHandler() {
    const userBid = auction.value.bids.find((bid) => bid.profiles.email === user.value.email)
    const userCompany = userBid?.profiles.email

    localLogs.value.push({
      type: 'CompetitorBid',
      timestamp: Date.now(),
      rank: rank.value, // bid.rank here same in the computed,
      rankColor: userCompany ? colorsMap[userCompany]?.secondary : '#DEF7EC' // RANK COLOR HERE SAME AS IN THE COMPUTED
    })
  }

  // Helper to check if an email is a training bot
  const isBotEmail = (email) => {
    return email && email.startsWith('bot-') && email.endsWith('@crown-procurement.com')
  }

  function japaneseCheckLeavingSupplier(roundToCheck) {
    if (!roundToCheck) return
    const allBids = auction.value.bids

    const allSuppliers = auction.value.auctions_sellers
    // Get the lowest bid for each supplier (most competitive in descending auction)
    const bestBidBySupplier = allBids.reduce((acc, bid) => {
      if (!acc[bid.profiles.email] || acc[bid.profiles.email].price > bid.price) {
        acc[bid.profiles.email] = bid
      }
      return acc
    }, {})

    // For training auctions, check if any non-bot user has placed a bid
    // Bots are reactive and wait for user bids in Japanese auctions
    const isTrainingAuction = auction.value.usage === 'training' || auction.value.usage === 'test'
    const hasUserBid = isTrainingAuction
      ? allBids.some((bid) => !isBotEmail(bid.profiles?.email))
      : true

    // Track suppliers who have already been logged as leaving
    const existingLeavingLogs = new Set(
      localLogs.value
        .filter((log) => log.type === 'LeavingSupplier')
        .map((log) => log.supplier_email)
    )

    allSuppliers.forEach((supplier) => {
      const supplierBid = bestBidBySupplier[supplier.seller_email]
      const userCompany = supplierBid?.profiles.email || supplier.seller_email

      // In training auctions, don't show bots as leaving until a user has placed a bid
      // Bots are reactive in Japanese auctions - they wait for user bids first
      const isBot = isBotEmail(supplier.seller_email)
      if (isTrainingAuction && isBot && !hasUserBid) {
        return // Skip this bot - they're waiting for user to bid first
      }

      // In training auctions, don't show user as leaving if they have a prebid
      // The prebid means they're still in the game until the price reaches their prebid level
      if (isTrainingAuction && !isBot && supplierBid) {
        // User has a prebid - only mark as leaving when price goes BELOW their lowest prebid
        if (supplierBid.price <= roundToCheck.price) {
          return // User is still active - their prebid is at or below current price
        }
      }

      // Supplier hasn't bid at all OR supplier's best bid is above current round price (eliminated)
      // In descending auctions: eliminated when lowest bid > current round price
      if (
        (!supplierBid || (supplierBid && supplierBid.price > roundToCheck.price)) &&
        !existingLeavingLogs.has(supplier.seller_email)
      ) {
        // console.log('supplierBid: ', supplierBid)
        const roundIndex = !supplierBid
          ? 0
          : japaneseRounds.value.findIndex((round) => round.price === supplierBid.price) + 1
        const leaveTimestamp = !supplierBid
          ? dayjs(auction.value.start_at).add(1, 'second').valueOf()
          : dayjs(auction.value?.start_at).add(
              (roundIndex + 1) * auction.value?.overtime_range,
              'minute'
            )
        const leavingPrice = !supplierBid
          ? japaneseRounds.value[0].price
          : japaneseRounds.value[roundIndex].price

        const LeavingSupplierLog = {
          type: 'LeavingSupplier',
          timestamp: leaveTimestamp,
          auction: auction,
          supplier: supplier.identifier,
          price: leavingPrice,
          rankColor: userCompany ? colorsMap[userCompany]?.secondary : '#CFE6FF',
          currentRound: roundIndex,
          supplier_email: supplier.seller_email
        }
        // Only add the log if the round has ended (timestamp is in the past)
        // This prevents showing "leaving" before the user has a chance to bid in the current round
        if (leaveTimestamp <= Date.now()) {
          localLogs.value.push(LeavingSupplierLog)
        }
      }
    })
  }

  function newRoundHandler() {
    const userBid = auction.value.bids.find((bid) => bid.profiles.email === user.value.email)
    const userCompany = userBid?.profiles.email
    const newLog = {
      type: 'NewDutchRound',
      bid: activeRound.value,
      auction: auction,
      timestamp: Date.now(),
      currentRound: nbPassedRounds.value,
      rankColor: userCompany ? colorsMap[userCompany]?.secondary : '#CFE6FF'
    }

    const isDuplicate = localLogs.value.some(
      (log) => log.type === 'NewDutchRound' && log.currentRound === nbPassedRounds.value
    )
    const includeEndedLog = localLogs.value.some((log) => log.type === 'AuctionEnded')
    if (!isDuplicate && !includeEndedLog) {
      localLogs.value.push(newLog)
      localLogs.value.sort((a, b) => {
        return b.timestamp - a.timestamp
      })
    }
  }

  const previousActiveRound = ref(null)

  watch(
    japaneseNbPassedRounds,
    (newNbPassedRounds, oldNbPassedRounds) => {
      if (auction.value?.type === 'japanese' && status.value?.label !== 'upcoming') {
        // Debounce the check to prevent multiple rapid calls
        if (newNbPassedRounds !== oldNbPassedRounds) {
          japaneseCheckLeavingSupplier(japaneseActiveRound.value)
        }
      }
    },
    { immediate: true }
  )

  watchEffect(() => {
    // Early return if auction is not active
    if (status.value.label !== 'active') return

    const newRound =
      auction.value.type === 'japanese' ? japaneseActiveRound.value : activeRound.value
    const oldRound = previousActiveRound.value
    // console.log('newRound: ', newRound, ' --- oldRound: ', oldRound)

    if (auction.value.type === 'dutch') {
      // Existing Dutch auction logic
      if (
        (nbPassedRounds.value === 0 && oldRound?.price === newRound?.price) ||
        (newRound && oldRound && oldRound.price < newRound.price) ||
        (newRound && !oldRound)
      ) {
        newRoundHandler()
      }
    }

    previousActiveRound.value = newRound
  })

  watch(rank, (newRank, oldRank) => {
    // For sealed-bid, only show CompetitorBid logs to buyers/admins
    const isSeller = !(auction.value?.buyer_id === user.value?.id || isAdmin.value)
    const skipForSealedBid = auction.value.type === 'sealed-bid' && isSeller

    if (
      newRank &&
      oldRank < newRank &&
      newRank > 0 &&
      oldRank > 0 &&
      auction.value.type !== 'japanese' &&
      !skipForSealedBid
    ) {
      rankHandler()
    }
  })
  // console.log('lastPrebidFromUser', lastPrebidFromUser.value)

  watch(
    end,
    (newEnd, oldEnd) => {
      if (
        newEnd > oldEnd &&
        auction?.value?.type === 'reverse' &&
        auction?.value?.type !== 'sealed-bid'
      ) {
        localLogs.value.push({
          type: 'OvertimeTriggered',
          timestamp: Date.now(),
          auction: auction
        })
        localLogs.value.sort((a, b) => {
          return b.timestamp - a.timestamp
        })
      }
    },
    { deep: true }
  )

  const aggregatePrebids = (bidsLogs, auctionType) => {
    if (auctionType === 'sealed-bid') {
      return bidsLogs
    }
    if (auctionType !== 'japanese') {
      // Keep existing logic for non-Japanese auctions
      const alreadyPlacedPrebid = {}
      for (let i = bidsLogs.length - 1; i >= 0; i--) {
        if (bidsLogs[i].type === 'AuctionPrebid') {
          const userEmail = bidsLogs[i].owner
          if (!alreadyPlacedPrebid[userEmail]) {
            bidsLogs[i].isFirstPrebid = true
            alreadyPlacedPrebid[userEmail] = true
          } else {
            bidsLogs[i].isFirstPrebid = false
          }
        }
      }
      return bidsLogs
    }

    // For Japanese auctions, we'll keep only the lowest price bid per timestamp group
    const timestampGroups = {}
    const alreadyPlacedJapPrebid = {}
    // First, group all prebids by user and timestamp
    bidsLogs.forEach((log) => {
      if (log.type === 'AuctionPrebid') {
        const userEmail = log.owner
        const timestamp = log.timestamp
        const key = `${userEmail}-${timestamp}`

        if (!timestampGroups[key]) {
          timestampGroups[key] = []
        }
        timestampGroups[key].push(log)
      }
    })

    // Create a new array with non-prebid logs
    const filteredLogs = bidsLogs.filter((log) => log.type !== 'AuctionPrebid')

    // Add only the lowest price bid from each timestamp group
    Object.values(timestampGroups).forEach((group) => {
      if (group.length > 0) {
        // Find the bid with the lowest price in the group
        const lowestPriceBid = group.reduce((lowest, current) =>
          current.bid.price < lowest.bid.price ? current : lowest
        )

        // Mark it as the first prebid
        lowestPriceBid.isFirstPrebid = true

        // Add only this bid to our filtered logs
        filteredLogs.push(lowestPriceBid)
      }
    })
    for (let i = filteredLogs.length - 1; i >= 0; i--) {
      if (filteredLogs[i].type === 'AuctionPrebid') {
        const userEmail = filteredLogs[i].owner
        if (!alreadyPlacedJapPrebid[userEmail]) {
          filteredLogs[i].isFirstPrebid = true
          alreadyPlacedJapPrebid[userEmail] = true
        } else {
          filteredLogs[i].isFirstPrebid = false
        }
      }
    }

    // Resort the logs by timestamp to maintain order
    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp)
  }

  // For Dutch: find the single winning bid (lowest price, earliest time) to filter out race condition duplicates
  const dutchWinningBid = computed(() => {
    if (auction.value?.type !== 'dutch') return null
    return (
      auction.value?.bids
        ?.filter((b) => b.type === 'bid')
        .sort((a, b) => a.price - b.price || new Date(a.created_at) - new Date(b.created_at))[0] ||
      null
    )
  })

  const bidsLogs = computed(() => {
    let logsList = auction.value?.bids
      .filter((bid) => {
        // For Dutch: only keep the winning bid, skip duplicates from race conditions
        if (bid.type === 'bid' && dutchWinningBid.value && bid.id !== dutchWinningBid.value.id) {
          return false
        }
        return true
      })
      .map((bid) => {
        const allRounds = auction.value?.type === 'japanese' ? japaneseRounds : rounds
        const foundRound = allRounds.value.indexOf(
          allRounds.value.find((round) => {
            return round.price === bid.price
          })
        )

        const logType =
          bid.type === 'prebid' && auction.value?.type !== 'sealed-bid'
            ? 'AuctionPrebid'
            : 'AuctionBid'

        // console.log('in logs bid', bid)
        // console.log('in logs enrichBidWithTotalValue', enrichBidWithTotalValue(bid))

        const log = {
          type: logType,
          bid: bid,
          totalValue: enrichBidWithTotalValue(bid),
          auction: auction,
          timestamp: dayjs(bid.created_at).valueOf(),
          isEnglish: auction.value?.type === 'reverse' || auction.value?.type === 'sealed-bid',
          auctionType: auction.value?.type,
          currentRound: foundRound,
          owner: bid.profiles?.email,
          isFirstPrebid: bid.type === 'prebid'
        }

        if (auction.value.type === 'dutch' && log.type == 'AuctionBid') {
          log.timestamp = log.timestamp + 999 // to ensure it comes after the last round log
        }

        if (bid.type !== 'prebid') {
          Object.assign(log, {
            rank: auction.value.type === 'reverse' ? bid.rank : foundRound + 1,
            rankColor: colorsMap[bid?.profiles?.email]?.secondary
          })
        }
        return log
      })
      .toSorted((a, b) => {
        return b.timestamp - a.timestamp
      })

    if (logsList && logsList.length > 0) {
      logsList = aggregatePrebids(logsList, auction.value?.type)
    }

    return logsList || []
  })

  const logs = computed(() => {
    let logsList = [...bidsLogs.value]
    const hideSubject = !(auction.value?.buyer_id === user.value?.id || isAdmin.value)

    const ownerCeilingPrice = {
      type: 'OwnCeilingPrice',
      timestamp: Date.parse('04 Dec 1998 00:12:00 GMT'),
      auction: auction
    }

    if (hideSubject) {
      logsList = [...logsList, ownerCeilingPrice]
    }

    if (auction.value?.type !== 'reverse' && auction.value?.type !== 'sealed-bid') {
      const notEnglishStartingPrice = {
        type: 'StartingPrice',
        timestamp: Date.parse('04 Dec 1997 00:12:00 GMT'),
        auction: auction.value,
        price: auction.value?.type === 'dutch' ? startingPrice.value : japaneseStartingPrice.value
      }

      logsList = [...logsList, notEnglishStartingPrice]
    }

    const startIn = {
      type: 'IncomingTime',
      timestamp: Date.parse('04 Dec 1995 00:12:00 GMT'), // always first position
      text: auction.value.start_at,
      timezone: auction.value.timezone
    }

    if (auction.value?.type !== 'sealed-bid') {
      logsList.push(startIn)
    } else {
      // For sealed bid auctions, show when the auction will close
      const closingTime = {
        type: 'ClosingTime',
        timestamp: Date.parse('04 Dec 1995 00:12:00 GMT'), // always first position
        text: auction.value.end_at,
        timezone: auction.value.timezone
      }
      logsList.push(closingTime)
    }

    if (
      status.value.label !== 'upcoming' &&
      auction.value?.type === 'japanese' &&
      lastPrebidFromUser.value &&
      hideSubject &&
      auction.value.dutch_prebid_enabled
    ) {
      // if (lastPrebidFromUser.value.price <= japaneseActiveRound.value.price) {
      const autoAccepted = {
        type: 'AutoAccepted',
        timestamp: +dayjs(auction?.value.start_at).add(500, 'ms').valueOf()
      }
      logsList = [...logsList, autoAccepted]
      // }
    }
    //TODO: Only for the supplier
    if (status.value.label === 'upcoming' && hideSubject) {
      if (auction.value?.auctions_sellers[0].terms_accepted) {
        const validatedTerms = {
          type: 'ValidatedTerms',
          timestamp: Date.parse('04 Dec 1999 00:12:00 GMT'),
          text: auction.value?.lot_name
        }
        logsList = [...logsList, validatedTerms]
      }

      if (
        logsList.length >= 1 &&
        (auction.value?.type === 'sealed-bid' ||
          (auction.value?.type !== 'reverse' && !auction.value.dutch_prebid_enabled))
      ) {
        return [...logsList].sort((a, b) => {
          return b.timestamp - a.timestamp
        })
      }
      if (logsList.length >= 1) {
        if (auction.value.bids.length > 0) {
          // There's already a prebid so we dans ask for it
          return logsList.sort((a, b) => {
            return b.timestamp - a.timestamp
          })
        } else {
          return [askPrebid, ...logsList].sort((a, b) => {
            return b.timestamp - a.timestamp
          })
        }
      } else {
        return [askPrebid]
      }
    } else if (
      auction.value?.auctions_sellers[0].terms_accepted &&
      logsList.length == 0 &&
      status.value.label !== 'closed' &&
      auction.value?.type !== 'sealed-bid'
    ) {
      return [askPrebid] // asking prebid when every logs are empty
    } else {
      const filteredLogs = localLogs.value.filter((log) => {
        // This filter is here to prevent weird logs during testing/updating auction.
        // If an auction started, but the owner postpone the auction it would show as an overtime.
        // There should be no overtime log in upcoming auctions.
        if (status.value.label === 'upcoming' && log.type === 'OvertimeTriggered') {
          return false
        }
        // NewDutchRound logs are now generated from rounds data (persistent across reloads)
        if (log.type === 'NewDutchRound') {
          return false
        }
        return true
      })

      // Generate round history from rounds data for Dutch/Japanese auctions.
      // This ensures round messages persist after auction ends (unlike ephemeral localLogs).
      if (
        (auction.value?.type === 'dutch' || auction.value?.type === 'japanese') &&
        status.value.label !== 'upcoming'
      ) {
        const allRounds = auction.value?.type === 'japanese' ? japaneseRounds.value : rounds.value
        const userBid = auction.value.bids.find((bid) => bid.profiles.email === user.value.email)
        const userCompany = userBid?.profiles.email
        allRounds.forEach((round, index) => {
          if (round.status === 'passed' || round.status === 'active') {
            logsList.push({
              type: 'NewDutchRound',
              bid: round,
              auction: auction,
              timestamp: +dayjs(auction.value.start_at)
                .add(index * auction.value.overtime_range, 'minute')
                .add(1, 'second')
                .valueOf(),
              currentRound: index,
              rankColor: userCompany ? colorsMap[userCompany]?.secondary : '#CFE6FF'
            })
          }
        })
      }

      if (status.value.label === 'closed') {
        logsList.push({
          type: 'AuctionEnded',
          timestamp: +dayjs(auction?.value.end_at).add(1, 's').valueOf() // Ensure it comes after the last bid in dutch auction
        })

        // Seller view: show own ending rank
        if (rank.value > 0 && hideSubject && auction.value?.max_rank_displayed > 0) {
          const displayedRank =
            auction.value?.type === 'japanese'
              ? +rank.value === 1
                ? +rank.value
                : '2'
              : +rank.value
          const endingRank = {
            type: 'EndingRank',
            timestamp: +dayjs(auction?.value.end_at).add(2, 's').valueOf(),
            rank: displayedRank,
            isDutch: auction.value?.type === 'dutch'
          }

          logsList.push(endingRank)
        }

        // Seller view (Dutch): show accepted price when seller can't see winning bid (RLS)
        if (
          hideSubject &&
          auction.value?.type === 'dutch' &&
          auction.value?.bids?.length === 0 &&
          activeRound.value
        ) {
          logsList.push({
            type: 'PriceAccepted',
            timestamp: +dayjs(auction?.value.end_at).valueOf(),
            price: activeRound.value.price,
            auction: auction
          })
        }

        // Admin/Buyer view: show ending ranks for each seller
        if (!hideSubject && auction.value?.max_rank_displayed > 0) {
          if (auction.value.type === 'dutch') {
            // Dutch: use pre-fetched ranks from get_seller_rank() stored procedure
            // Only ONE seller with rank === 1 is the winner
            auction.value.auctions_sellers.forEach((seller, index) => {
              const rank = sellerRanks.value[seller.seller_email]
              if (rank === 1) {
                logsList.push({
                  type: 'EndingRank',
                  timestamp: +dayjs(auction?.value.end_at)
                    .add(2, 's')
                    .add(index * 100, 'ms')
                    .valueOf(),
                  rank,
                  isDutch: true,
                  sellerName: seller.identifier
                })
              }
            })
          }
        }
      }

      // For sealed-bid auctions, don't show "AuctionStarted" since bidding happens before start_at
      // (start_at is when bids are revealed, not when bidding begins)
      if (status.value.label !== 'upcoming' && auction.value?.type !== 'sealed-bid') {
        logsList.push({
          type: 'AuctionStarted',
          timestamp: +dayjs(auction?.value.start_at).valueOf() // Ensure it comes after the last bid in dutch auction
        })
      }

      const lastLog = [...logsList, ...filteredLogs]

      const sortedLog = lastLog.toSorted((a, b) => {
        return b.timestamp - a.timestamp
      })

      return sortedLog
    }
  })

  return {
    logs,
    clearLocalLogs: () => {
      localLogs.value = []
    }
  }
}
