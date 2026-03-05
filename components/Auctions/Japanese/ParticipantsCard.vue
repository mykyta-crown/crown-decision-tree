<template>
  <v-card class="d-flex flex-column flex-grow-1 px-1">
    <v-card-title class="font-weight-black d-flex justify-space-between align-center pb-0 pt-4">
      {{ t('dutch.participantsCard.title') }}
    </v-card-title>

    <v-card-text class="pa-0 pb-4">
      <v-table fixed-header density="compact" class="overflow-auto leaders-table px-4">
        <thead>
          <tr class="text-grey text-body-2">
            <th class="text-left">
              {{ t('dutch.participantsCard.name') }}
            </th>
            <th class="text-left">
              {{ t('dutch.participantsCard.status') }}
            </th>
            <th v-if="auction.dutch_prebid_enabled" class="text-center">
              {{ t('dutch.participantsCard.preBid') }}
            </th>
            <th class="text-center">
              {{ t('dutch.participantsCard.bestBid') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="presence in formatPresences" :key="presence.company">
            <td class="company-cell text-truncate pt-2">
              <div class="d-flex align-center">
                <span
                  v-if="isPreferredAuction"
                  class="mr-1 preferred-crown"
                  :class="{ 'preferred-crown--hidden': !isPreferredSupplier(presence.email) }"
                />
                <div
                  tile
                  variant="text"
                  class="rounded-lg justify-center text-start py-1 flex-grow-1 overflow-hidden company-background"
                  :style="{
                    'background-color': colorsMap[presence.email]?.secondary || '#F8F8F8'
                  }"
                >
                  <div class="text-truncate px-2">
                    {{ presence.company }}
                    <v-tooltip activator="parent">
                      <span>{{ presence.company }}</span>
                    </v-tooltip>
                  </div>
                </div>
              </div>
            </td>
            <td
              class="text-capitalize"
              :class="presence.status === 'online' ? 'text-success' : 'text-error'"
            >
              {{ t(`dutch.participantsCard.${presence.status}`) }}
            </td>
            <!-- Prebid -->
            <td v-if="auction.dutch_prebid_enabled" class="text-center text-no-wrap">
              <span v-if="prebidsByEmail[presence.email]">
                <span class="font-weight-bold">{{
                  formatNumber(prebidsByEmail[presence.email]?.price)
                }}</span>
                {{ auction?.currency }}
              </span>
              <span v-else>-</span>
            </td>
            <!-- Lowest Bid -->
            <td class="text-center text-no-wrap">
              <div v-if="bidsByEmail[presence.email]">
                <span class="font-weight-bold">{{
                  formatNumber(bidsByEmail[presence.email].price)
                }}</span>
                {{ auction?.currency }}
              </div>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
<script setup>
import _ from 'lodash'
import dayjs from 'dayjs'

const { t } = useTranslations()

const route = useRoute()
const { auction, lowerBidsByComp: bestBidsByCompanies } = await useUserAuctionBids({
  auctionId: route.params.auctionId
})

const supabase = useSupabaseClient()
const presences = ref([])

const { getColors } = useColorSchema()
const colorsMap = await getColors()

const prebids = computed(() => {
  return auction.value.bids.filter((e) => e.type === 'prebid')
})

const prebidsByEmail = computed(() => {
  return _(prebids.value)
    .groupBy((bid) => bid.profiles.email)
    .mapValues((bidGroup) => _.minBy(bidGroup, 'price'))
    .value()
})

const bidsByEmail = computed(() => {
  return _(auction.value.bids)
    .groupBy((bid) => bid.profiles.email)
    .mapValues((bidGroup) => _.minBy(bidGroup, 'price'))
    .value()
})

// Check if this is a preferred auction (at least one supplier has reduced time)
const isPreferredAuction = computed(() => {
  const roundDuration = auction.value.overtime_range * 60
  return auction.value.auctions_sellers?.some(
    (s) => s.time_per_round && s.time_per_round < roundDuration
  )
})

// Check if a supplier is a preferred supplier (gets full round access, no delay)
// Only relevant in preferred auctions
// Preferred = time_per_round >= roundDuration (or NULL = full access)
// Not preferred = time_per_round < roundDuration (has to wait)
const isPreferredSupplier = (email) => {
  if (!isPreferredAuction.value) return false // No crown in regular auctions
  const seller = auction.value.auctions_sellers.find((s) => s.seller_email === email)
  if (!seller?.time_per_round) return true // NULL means full access = preferred
  const roundDuration = auction.value.overtime_range * 60
  return seller.time_per_round >= roundDuration
}

const formatPresences = computed(() => {
  const formatted = auction.value.auctions_sellers.map((seller) => {
    const bidder = bestBidsByCompanies.value.find((e) => e.profiles.email === seller.seller_email)

    const findPresence = presences.value.find((p) => p.user === seller.seller_profile?.id)
    const status = findPresence ? 'online' : 'offline'
    if (bidder) {
      return {
        company: bidder.company.name,
        email: bidder.profiles.email,
        status,
        lowestBid: bidder.price,
        timestamp: +dayjs(bidder.created_at)
      }
    } else {
      return { company: seller.identifier, status, email: seller.seller_email }
    }
  })

  return _.orderBy(formatted, ['lowestBid', 'timestamp'], ['asc', 'asc'])
})

usePresences({
  channelName: `presences_${route.params.auctionId}`,
  callback: ({ newPresences, leftPresences }) => {
    if (newPresences) {
      presences.value = [...presences.value, ...newPresences]
    }

    if (leftPresences) {
      presences.value = presences.value.filter((currPresence) => {
        return !leftPresences.find((leftPresence) => leftPresence.user === currPresence.user)
      })
    }
  }
})
</script>

<style scoped>
.leaders-table {
  max-height: 322px;
}

.company-cell {
  max-width: 140px;
}
.company-cell > div {
  min-width: 0;
}
.company-background {
  min-width: 0;
}
.v-table .v-table__wrapper > table > tbody > tr > td {
  border: none !important;
}
td:last-child {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
td:first-child {
  padding-left: 0 !important;
}
th:last-child {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
th:first-child {
  padding-left: 0 !important;
}
.preferred-crown {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  background-color: #5fe2ae;
  mask-image: url('@/assets/icons/activity-log/pepicons-pencil_crown.svg');
  mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-image: url('@/assets/icons/activity-log/pepicons-pencil_crown.svg');
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
}
.preferred-crown--hidden {
  background-color: transparent;
  mask-image: none;
  -webkit-mask-image: none;
}
</style>
