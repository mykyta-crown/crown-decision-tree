import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { isValidISO } from '~/composables/helpers/date'

/**
 * Composable for managing table filters
 * Handles global search, column filters, dropdown filters, and date filters
 */
export function useTableFilters(
  formattedAuctions,
  globalSearch,
  dropdownFilters,
  sortBy,
  headers,
  t
) {
  // Column-specific search filters (not exposed to parent, internal only)
  const columnFilters = ref({
    client: '',
    owner: ''
  })

  /**
   * Apply all filters to the formatted auctions
   */
  const filteredAuctions = computed(() => {
    let filtered = formattedAuctions.value

    // Global search - search in name, client, and owner
    if (globalSearch.value) {
      const search = globalSearch.value.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.client?.toLowerCase().includes(search) ||
          a.name?.toLowerCase().includes(search) ||
          a.owner?.toLowerCase().includes(search)
      )
    }

    // Column search filters
    if (columnFilters.value.client) {
      const search = columnFilters.value.client.toLowerCase()
      filtered = filtered.filter((a) => a.client?.toLowerCase().includes(search))
    }

    if (columnFilters.value.owner) {
      const search = columnFilters.value.owner.toLowerCase()
      filtered = filtered.filter((a) => a.owner?.toLowerCase().includes(search))
    }

    // Dropdown filters (multiple selection)
    if (dropdownFilters.value.clients.length) {
      filtered = filtered.filter((a) => dropdownFilters.value.clients.includes(a.client))
    }

    if (dropdownFilters.value.types.length) {
      filtered = filtered.filter((a) => {
        const auction = a.auctions[0]
        let typeKey = ''
        if (auction.type === 'dutch') {
          typeKey = auction.auctions_sellers.find((seller) => seller.time_per_round)
            ? 'preferredDutch'
            : 'dutch'
        } else if (auction.type === 'japanese') {
          typeKey = auction.max_rank_displayed === 0 ? 'japaneseNoRank' : 'japanese'
        } else if (auction.type === 'reverse') {
          typeKey = 'english'
        } else if (auction.type === 'sealed-bid') {
          typeKey = 'sealedBid'
        } else {
          typeKey = auction.type
        }
        return dropdownFilters.value.types.includes(typeKey)
      })
    }

    if (dropdownFilters.value.usages.length) {
      filtered = filtered.filter((a) => dropdownFilters.value.usages.includes(a.usage))
    }

    if (dropdownFilters.value.owners.length) {
      filtered = filtered.filter((a) => dropdownFilters.value.owners.includes(a.owner))
    }

    if (dropdownFilters.value.statuses.length) {
      filtered = filtered.filter((a) => dropdownFilters.value.statuses.includes(a.status.label))
    }

    // Date filter - only apply if type is set and not null
    const dateFilterType = dropdownFilters.value.dateFilter?.type
    if (dateFilterType && dateFilterType !== null) {
      const { type, date, startDate, endDate } = dropdownFilters.value.dateFilter

      if (type === 'before' && date && isValidISO(date)) {
        filtered = filtered.filter((a) => a.start_at && a.start_at < date)
      } else if (type === 'after' && date && isValidISO(date)) {
        filtered = filtered.filter((a) => a.start_at && a.start_at > date)
      } else if (
        type === 'between' &&
        startDate &&
        endDate &&
        isValidISO(startDate) &&
        isValidISO(endDate)
      ) {
        filtered = filtered.filter(
          (a) => a.start_at && a.start_at >= startDate && a.start_at <= endDate
        )
      }
    }

    return filtered
  })

  /**
   * Format date for display in badges
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return ''
    return dayjs(dateString).format('DD/MM/YYYY')
  }

  /**
   * Get list of active filters for badges
   */
  const activeFiltersList = computed(() => {
    const filters = []

    // Clients
    dropdownFilters.value.clients.forEach((client) => {
      filters.push({
        type: 'clients',
        rawValue: client,
        label: client
      })
    })

    // Types
    dropdownFilters.value.types.forEach((type) => {
      filters.push({
        type: 'types',
        rawValue: type,
        label: t(`components.auctionsDatatable.auctionTypes.${type}`) || type
      })
    })

    // Usages
    dropdownFilters.value.usages.forEach((usage) => {
      filters.push({
        type: 'usages',
        rawValue: usage,
        label: t(`auction.usage.${usage}`) || usage
      })
    })

    // Owners
    dropdownFilters.value.owners.forEach((owner) => {
      filters.push({
        type: 'owners',
        rawValue: owner,
        label: owner
      })
    })

    // Statuses
    dropdownFilters.value.statuses.forEach((status) => {
      filters.push({
        type: 'statuses',
        rawValue: status,
        label: t(`status.${status}`) || status
      })
    })

    // Date filter
    if (dropdownFilters.value.dateFilter.type) {
      const dateFilter = dropdownFilters.value.dateFilter
      let label = ''

      if (dateFilter.type === 'before' && dateFilter.date) {
        label = `Before: ${formatDateForDisplay(dateFilter.date)}`
      } else if (dateFilter.type === 'after' && dateFilter.date) {
        label = `After: ${formatDateForDisplay(dateFilter.date)}`
      } else if (dateFilter.type === 'between' && dateFilter.startDate && dateFilter.endDate) {
        label = `Between: ${formatDateForDisplay(dateFilter.startDate)} - ${formatDateForDisplay(dateFilter.endDate)}`
      }

      if (label) {
        filters.push({
          type: 'dateFilter',
          rawValue: null,
          label
        })
      }
    }

    // Sort
    sortBy.value.forEach((sort) => {
      const columnTitle = headers.value.find((h) => h.key === sort.key)?.title || sort.key
      const orderLabel = sort.order === 'asc' ? 'A–Z' : 'Z–A'
      filters.push({
        type: 'sort',
        rawValue: sort.key,
        label: `Sorting ${orderLabel}`
      })
    })

    return filters
  })

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    globalSearch.value = ''
    columnFilters.value = {
      client: '',
      owner: ''
    }
    dropdownFilters.value = {
      clients: [],
      types: [],
      usages: [],
      owners: [],
      statuses: [],
      dateFilter: {
        type: null,
        date: null,
        startDate: null,
        endDate: null
      }
    }
    sortBy.value = []
  }

  /**
   * Remove individual filter
   * @param {Object} filterItem - Filter item to remove
   */
  const removeFilter = (filterItem) => {
    switch (filterItem.type) {
      case 'clients':
        dropdownFilters.value.clients = dropdownFilters.value.clients.filter(
          (c) => c !== filterItem.rawValue
        )
        break
      case 'types':
        dropdownFilters.value.types = dropdownFilters.value.types.filter(
          (t) => t !== filterItem.rawValue
        )
        break
      case 'usages':
        dropdownFilters.value.usages = dropdownFilters.value.usages.filter(
          (u) => u !== filterItem.rawValue
        )
        break
      case 'owners':
        dropdownFilters.value.owners = dropdownFilters.value.owners.filter(
          (o) => o !== filterItem.rawValue
        )
        break
      case 'statuses':
        dropdownFilters.value.statuses = dropdownFilters.value.statuses.filter(
          (s) => s !== filterItem.rawValue
        )
        break
      case 'dateFilter':
        // Ensure reactivity by updating nested properties individually
        dropdownFilters.value.dateFilter.type = null
        dropdownFilters.value.dateFilter.date = null
        dropdownFilters.value.dateFilter.startDate = null
        dropdownFilters.value.dateFilter.endDate = null
        break
      case 'sort':
        sortBy.value = sortBy.value.filter((item) => item.key !== filterItem.rawValue)
        break
    }
  }

  /**
   * Select date filter type (toggle behavior)
   * @param {string} type - Date filter type ('before', 'after', or 'between')
   */
  const selectDateFilterType = (type) => {
    if (dropdownFilters.value.dateFilter.type === type) {
      // Si on clique sur le même type, on le désélectionne
      dropdownFilters.value.dateFilter = {
        type: null,
        date: null,
        startDate: null,
        endDate: null
      }
    } else {
      // Sinon on change le type et on réinitialise les dates
      dropdownFilters.value.dateFilter = {
        type,
        date: null,
        startDate: null,
        endDate: null
      }
    }
  }

  /**
   * Check if a header is active (has sorting or filtering applied)
   * @param {string} key - Column key
   * @returns {boolean}
   */
  const isHeaderActive = (key) => {
    // Check if sorted
    if (sortBy.value.find((item) => item.key === key)) return true

    // Check filters by column
    if (key === 'client') return dropdownFilters.value.clients.length > 0
    if (key === 'date') return !!dropdownFilters.value.dateFilter.type
    if (key === 'type') return dropdownFilters.value.types.length > 0
    if (key === 'usage') return dropdownFilters.value.usages.length > 0
    if (key === 'owner') return dropdownFilters.value.owners.length > 0
    if (key === 'status') return dropdownFilters.value.statuses.length > 0

    return false
  }

  return {
    columnFilters,
    filteredAuctions,
    formatDateForDisplay,
    activeFiltersList,
    clearAllFilters,
    removeFilter,
    selectDateFilterType,
    isHeaderActive
  }
}
