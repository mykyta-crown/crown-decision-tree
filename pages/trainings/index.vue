<template>
  <div>
    <v-container v-if="profile" class="px-5 pb-10" :fluid="width < 1440">
      <v-row align="center" justify="center" class="pb-0">
        <v-col cols="12">
          <span class="text-h4 d-flex align-center" style="height: 40px">
            {{ t('title') }}
          </span>
        </v-col>
      </v-row>
      <v-skeleton-loader v-if="loading" type="card@4" class="mx-auto custom-skeleton" />
      <template v-else>
        <v-row v-for="auction in auctions" :key="auction.id" class="my-4">
          <v-col>
            <TrainingsDemoAuctionItem :auction="auction" />
          </v-col>
        </v-row>
      </template>
    </v-container>
  </div>
</template>

<script setup>
import { useUser } from '#imports'
import { useDisplay } from 'vuetify'

const { t } = useTranslations()
const { width } = useDisplay()
const { profile } = useUser()
const loading = ref(false)
const supabase = useSupabaseClient()

const STATUS_PRIORITY = {
  active: 1,
  upcoming: 2,
  closed: 3,
  default: 4
}
const auctions = ref([])
const sortAuctionsByStatus = (auctions) => {
  auctions.forEach((auction) => {
    const status = getAuctionStatus(auction.start_at, auction.end_at, auction.type)
    if (!auction.published) {
      status.label = 'draft'
      status.color = 'grey-ligthen-2'
    }
    auction.status = status
  })
  return auctions.sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status.label] || STATUS_PRIORITY.default
    const priorityB = STATUS_PRIORITY[b.status.label] || STATUS_PRIORITY.default

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    return a.lot_number - b.lot_number
  })
}

const getAuctionType = (auction) => {
  if (
    auction.type === 'dutch' &&
    auction.auctions_sellers.some((seller) => seller.time_per_round)
  ) {
    return 'dutch-preferred'
  }
  if (auction.type === 'japanese' && auction.max_rank_displayed === 0) {
    return 'japanese-no-rank'
  }
  return auction.type === 'reverse' ? 'english' : auction.type
}
const processAuctionGroup = (group) => {
  const sortedAuctions = sortAuctionsByStatus(group.auctions)
  const primaryAuction = sortedAuctions[0]

  return {
    ...primaryAuction,
    created_at: primaryAuction.created_at,
    isMultilot: sortedAuctions.length > 1,
    ...group,
    auction_id: primaryAuction.id,
    name: group.name || primaryAuction.name,
    type: getAuctionType(primaryAuction)
  }
}

async function getAuctions() {
  loading.value = true
  const createBaseQuery = (supabase) => {
    return supabase
      .from('auctions_group_settings')
      .select(
        `
      id,
      name,
      created_at,
      timing_rule,
      trainings(*),
      auctions!inner(
        *,
        users_auctions_status(is_favorite, is_archived),
        auctions_sellers(time_per_round)
      )
    `
      )
      .eq('auctions.usage', 'training')
      .eq('auctions.deleted', false)
      .order('created_at', { ascending: false })
  }

  const { data: auctionsGroup, error } = await createBaseQuery(supabase)
  if (error) throw error

  const filteredAuctions = auctionsGroup
    .filter((group) => !group.auctions[0].users_auctions_status?.[0]?.is_archived)
    .map(processAuctionGroup)
  // .filter((auction) => auction.trainings.length > 0)
  // console.log('AUCTIONS', filteredAuctions)

  auctions.value = filteredAuctions
  loading.value = false
}

onMounted(async () => {
  await getAuctions()
})
</script>

<style scoped>
.line-height-1 {
  line-height: 150% !important;
}
:deep(.v-selection-control) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}
:deep(.v-label) {
  font-size: 14px !important;
  margin-left: 10px !important;
}
.max-height {
  max-height: 162px !important;
}
.custom-skeleton:deep(.v-skeleton-loader__image),
.custom-skeleton:deep(.v-skeleton-loader__heading) {
  background-color: rgb(var(--v-theme-grey-ligthen-1)) !important;
}
</style>
