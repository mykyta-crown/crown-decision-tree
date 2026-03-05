<template>
  <v-tabs v-model="tabs" hide-slider class="" height="36">
    <v-tab
      v-if="isAdmin || isBuyer"
      :value="0"
      :class="tabs === 0 ? 'bg-yellow-lighten-1 font-weight-bold' : ''"
      class="text-primary border rounded-tab d-flex align-center justify-center mr-1"
      rounded="0"
      height="36"
    >
      {{ t('auction.usage.all') }}
    </v-tab>
    <v-tab
      :value="1"
      :class="tabs === 1 ? 'bg-purple font-weight-bold' : ''"
      class="text-primary border rounded-tab d-flex align-center justify-center mr-1"
      rounded="0"
      height="36"
    >
      {{ t('auction.usage.real') }}
    </v-tab>
    <v-tab
      :value="2"
      :class="tabs === 2 ? 'bg-grass font-weight-bold' : ''"
      class="text-primary border rounded-tab d-flex align-center justify-center mr-1"
      rounded="0"
      height="36"
    >
      {{ t('auction.usage.training') }}
    </v-tab>
    <v-tab
      v-if="isAdmin || isBuyer"
      :value="3"
      :class="tabs === 3 ? 'bg-grass font-weight-bold' : ''"
      class="text-primary border rounded-tab d-flex align-center justify-center mr-1"
      rounded="0"
      height="36"
    >
      {{ t('auction.usage.test') }}
    </v-tab>
    <v-tab
      v-if="isAdmin || isBuyer"
      :value="4"
      :class="tabs === 4 ? 'bg-grass font-weight-bold' : ''"
      class="text-primary border rounded-tab d-flex align-center justify-center mr-1"
      rounded="0"
      height="36"
    >
      {{ t('auction.sort.favorites') }}
    </v-tab>
    <!--
      <v-tab
      :value="3"
      class="text-primary border  rounded-tab  d-flex align-center justify-center mr-1"
      rounded="0"
      :class="tabs === 3 ? 'bg-blue font-weight-bold' : ''"
      >
      Suppliers
      </v-tab>
    -->
  </v-tabs>
  <v-tabs-window v-model="tabs">
    <v-tabs-window-item v-if="isAdmin || isBuyer" :value="0">
      <HomeAuctionsDatatable
        v-if="formatedAuctions.length"
        :loading="datatableLoading"
        :auctions="formatedAuctions"
      />
      <DashboardEmptyAuctionsCard v-else />
    </v-tabs-window-item>
    <v-tabs-window-item :value="1">
      <HomeAuctionsDatatable
        v-if="realAuctions.length"
        :loading="datatableLoading"
        :auctions="realAuctions"
      />
      <DashboardEmptyAuctionsCard v-else />
    </v-tabs-window-item>
    <v-tabs-window-item :value="2">
      <HomeAuctionsDatatable
        v-if="trainingAuctions.length"
        :loading="datatableLoading"
        :auctions="trainingAuctions"
      />
      <DashboardEmptyAuctionsCard v-else />
    </v-tabs-window-item>
    <v-tabs-window-item v-if="isAdmin || isBuyer" :value="3">
      <HomeAuctionsDatatable
        v-if="testAuctions.length"
        :loading="datatableLoading"
        :auctions="testAuctions"
      />
      <DashboardEmptyAuctionsCard v-else />
    </v-tabs-window-item>
    <v-tabs-window-item v-if="isAdmin || isBuyer" :value="4">
      <HomeAuctionsDatatable
        v-if="favoritesAuctions.length"
        :loading="datatableLoading"
        :auctions="favoritesAuctions"
      />
      <DashboardEmptyAuctionsCard v-else />
    </v-tabs-window-item>
    <!--
      <v-tabs-window-item
      :value="3"
      >
      <DashboardSuppliersDatatable />
      </v-tabs-window-item>
    -->
  </v-tabs-window>
</template>
<script setup>
import { map } from 'lodash'
import { onMounted, ref } from 'vue'
import { watchThrottled } from '@vueuse/core'

const { user, isAdmin, isBuyer } = useUser()
const { t } = useTranslations()

const supabase = useSupabaseClient()

const route = useRoute()

const tabs = ref(0)

const formatedAuctions = ref([])
const favoritesAuctions = ref([])
const realAuctions = ref([])
const trainingAuctions = ref([])
const testAuctions = ref([])

const page = ref(1)
const loading = ref(true)
const datatableLoading = ref(false)

const filterByCompany = ref(route.query.company || 'All')

watchThrottled(
  [route],
  async () => {
    filterByCompany.value = route.query.company || 'All'
    page.value = 1
    await getAuctions()
  },
  { throttle: 2000 }
)

// CAll
const PAGE_SIZE = 10
const STATUS_PRIORITY = {
  active: 1,
  upcoming: 2,
  closed: 3,
  default: 4
}

const createAuctionsBaseQuery = (usage = null) => {
  let query = supabase
    .from('auctions_group_settings')
    .select(
      `
      id,
      name,
      created_at,
      timing_rule,
      auctions!inner(
        *,
        users_auctions_status(is_favorite, is_archived),
        auctions_sellers(seller_email),
        profiles!buyer_id(*, companies(*))
      )
    `,
      { count: 'exact' }
    )
    .eq('auctions.deleted', false)
    .limit(PAGE_SIZE)
    .order('created_at', { ascending: false })

  if (route.query.company) {
    query = query.eq('auctions.company_id', route.query.company)
  }

  if (usage) {
    query = query.eq('auctions.usage', usage)
  }

  return query
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
    name: group.name || primaryAuction.name
  }
}

const sortAuctionsByStatus = (auctions) => {
  auctions.forEach((auction) => {
    const startAt =
      auction.type === 'sealed-bid' && auction.usage !== 'training'
        ? auction.created_at
        : auction.start_at
    const status = getAuctionStatus(startAt, auction.end_at, auction.type)
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

async function getAuctions() {
  try {
    datatableLoading.value = true

    let favQuery = supabase
      .from('users_auctions_status')
      .select(
        `
      *,
      auctions(
        *,
        users_auctions_status(is_favorite, is_archived),
        auctions_sellers(seller_email),
        profiles!buyer_id(*, companies(*)),
        auctions_group_settings(
          id,
          name,
          created_at,
          timing_rule
        )
      )
    `
      )
      .eq('is_favorite', true)
      .eq('user_id', user.value.id)
      .order('created_at', { referencedTable: 'auctions', ascending: false })
      .limit(10)

    if (route.query.company) {
      favQuery = favQuery.eq('auctions.company_id', route.query.company)
    }

    const { data: favAuctions } = await favQuery

    const favoritesAuctionsMap = {}

    favAuctions.forEach((favStatus) => {
      const auction = favStatus.auctions
      if (auction) {
        if (!favoritesAuctionsMap[auction.auctions_group_settings_id]) {
          favoritesAuctionsMap[auction.auctions_group_settings_id] = Object.assign(
            {
              auctions: [auction]
            },
            auction.auctions_group_settings
          )
        } else {
          favoritesAuctionsMap[auction.auctions_group_settings_id].auctions.push(auction)
        }
      }
    })

    const favoritesAuctionsGroup = map(favoritesAuctionsMap, (g) => g).sort((a, b) => {
      const aDate = new Date(a.auctions[0].created_at)
      const bDate = new Date(b.auctions[0].created_at)
      return bDate - aDate
    })

    const [
      { data: allAuctionsGroup },
      { data: realAuctionsGroup },
      { data: trainingAuctionsGroup },
      { data: testAuctionsGroup }
    ] = await Promise.all([
      createAuctionsBaseQuery(),
      createAuctionsBaseQuery('real'),
      createAuctionsBaseQuery('training'),
      createAuctionsBaseQuery('test')
    ])

    // Process all auctions
    const processAuctions = (auctionsGroup) => {
      return auctionsGroup
        .filter((group) => !group.auctions[0].users_auctions_status?.[0]?.is_archived)
        .map(processAuctionGroup)
    }

    formatedAuctions.value = processAuctions(allAuctionsGroup)
    realAuctions.value = processAuctions(realAuctionsGroup)
    trainingAuctions.value = processAuctions(trainingAuctionsGroup)
    testAuctions.value = processAuctions(testAuctionsGroup)
    favoritesAuctions.value = processAuctions(favoritesAuctionsGroup)
  } catch (error) {
    console.error('Error fetching auctions:', error)
  } finally {
    datatableLoading.value = false
    loading.value = false
  }
}

onMounted(async () => {
  await getAuctions()
})
</script>
<style scoped>
.rounded-tab {
  border-radius: 4px 4px 0 0 !important;
  border-bottom: none !important;
  font-weight: 400;
}
</style>
