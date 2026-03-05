import { computed } from 'vue'
import dayjs from 'dayjs'

/**
 * Composable for formatting auction data for display
 * Handles data transformation, type detection, and unique value extraction
 */
export function useAuctionFormatting(auctions, t) {
  /**
   * Capitalize first letter of string
   * @param {string} string - String to capitalize
   * @returns {string} Capitalized string
   */
  const firstLetterUppercase = (string) => {
    if (string === 'reverse') {
      string = 'english'
    }
    if (string.length === 0) {
      return string
    } else {
      return string.charAt(0).toUpperCase() + string.slice(1)
    }
  }

  /**
   * Get the subtype label for an auction
   * @param {Object} item - Auction item
   * @returns {string} Translated subtype label
   */
  const getSubType = (item) => {
    const auction = item.auctions[0]
    if (auction.type === 'dutch') {
      return auction.auctions_sellers.find((seller) => seller.time_per_round)
        ? t('components.auctionsDatatable.auctionTypes.preferredDutch')
        : t('components.auctionsDatatable.auctionTypes.dutch')
    } else if (auction.type === 'japanese') {
      return auction.max_rank_displayed === 0
        ? t('components.auctionsDatatable.auctionTypes.japaneseNoRank')
        : t('components.auctionsDatatable.auctionTypes.japanese')
    } else if (auction.type === 'reverse') {
      return t('components.auctionsDatatable.auctionTypes.english')
    } else if (auction.type === 'sealed-bid') {
      return t('components.auctionsDatatable.auctionTypes.sealedBid')
    } else {
      return firstLetterUppercase(auction.type)
    }
  }

  /**
   * Format full date with time
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatFullDate = (dateString) => {
    const dateObj = dayjs(dateString)
    return dateObj.isValid() ? dateObj.format('DD MMM YYYY [at] HH:mm') : '-'
  }

  /**
   * Format auctions data for table display
   */
  const formattedAuctions = computed(() => {
    const table = auctions.value.map((auction) => {
      const dateObj = dayjs(auction.start_at)
      return {
        ...auction,
        date: dateObj.isValid() ? dateObj.format('DD MMM YYYY') : '-',
        client: auction.profiles?.companies?.name,
        owner: `${auction.profiles?.first_name} ${auction.profiles?.last_name}`
      }
    })

    return table
  })

  /**
   * Get unique client names for filtering
   */
  const uniqueClients = computed(() => {
    const clients = formattedAuctions.value.map((a) => a.client).filter(Boolean)
    return [...new Set(clients)].sort()
  })

  /**
   * Get unique auction types for filtering
   */
  const uniqueTypes = computed(() => {
    const typeKeys = formattedAuctions.value
      .map((a) => {
        const auction = a.auctions[0]
        if (auction.type === 'dutch') {
          return auction.auctions_sellers.find((seller) => seller.time_per_round)
            ? 'preferredDutch'
            : 'dutch'
        } else if (auction.type === 'japanese') {
          return auction.max_rank_displayed === 0 ? 'japaneseNoRank' : 'japanese'
        } else if (auction.type === 'reverse') {
          return 'english'
        } else if (auction.type === 'sealed-bid') {
          return 'sealedBid'
        } else {
          return auction.type
        }
      })
      .filter(Boolean)

    const uniqueKeys = [...new Set(typeKeys)].sort()

    return uniqueKeys.map((key) => ({
      value: key,
      label: t(`components.auctionsDatatable.auctionTypes.${key}`) || key
    }))
  })

  /**
   * Get unique usages for filtering
   */
  const uniqueUsages = computed(() => {
    const usages = formattedAuctions.value.map((a) => a.usage || 'test').filter(Boolean)
    return [...new Set(usages)].sort()
  })

  /**
   * Get unique owners for filtering
   */
  const uniqueOwners = computed(() => {
    const owners = formattedAuctions.value.map((a) => a.owner).filter(Boolean)
    return [...new Set(owners)].sort()
  })

  /**
   * Get unique statuses for filtering
   */
  const uniqueStatuses = computed(() => {
    const statuses = formattedAuctions.value.map((a) => a.status?.label).filter(Boolean)
    return [...new Set(statuses)].sort()
  })

  return {
    firstLetterUppercase,
    getSubType,
    formatFullDate,
    formattedAuctions,
    uniqueClients,
    uniqueTypes,
    uniqueUsages,
    uniqueOwners,
    uniqueStatuses
  }
}
