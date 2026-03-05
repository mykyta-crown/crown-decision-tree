<template>
  <v-container class="px-5 pb-10" :fluid="width < 1440">
    <v-alert
      v-if="fillInfosNeeded"
      class="mt-4"
      :title="t('alert.title')"
      type="error"
      variant="tonal"
    >
      <v-row>
        <v-col cols="12">
          {{ t('alert.message') }} <br />
          {{ t('alert.registerText') }}
        </v-col>
        <v-col cols="auto">
          <v-btn-primary @click="showEditDialog = true">
            {{ t('alert.linkText') }}
          </v-btn-primary>
        </v-col>
      </v-row>
    </v-alert>

    <UserManagementProfileEditDialog
      v-if="profile"
      v-model="showEditDialog"
      :profile-id="profile.id"
      @saved-profile="getSession(true)"
    />
    <v-row v-if="!loading" align="center" class="mb-4 mx-0">
      <v-col cols="12" class="d-flex align-center justify-space-between px-0">
        <div class="text-h4">
          <span>{{ t('header.title') }} </span>
          <v-chip
            tile
            variant="text"
            class="ml-2 rounded justify-center text-h6 font-weight-bold text-black"
            :class="`bg-${tabsColors[activeTab]}`"
            label
          >
            {{ displayedAuctionsCount }}
          </v-chip>
        </div>
        <v-text-field
          v-model="globalSearch"
          density="compact"
          :placeholder="t('header.searchPlaceholder') || 'Search'"
          variant="outlined"
          hide-details
          clearable
          style="width: 285px; max-width: 285px; flex-shrink: 0; height: 40px"
          :class="['global-search-field', { 'ml-auto': !isAdmin }]"
        >
          <template #prepend-inner>
            <v-img src="@/assets/icons/basic/Search.svg" width="20" height="20" />
          </template>
        </v-text-field>
        <div v-if="isAdmin" class="d-flex ga-2">
          <div id="delete-btn-position" />
          <HomeTestAuctionButtons v-if="config.public.vercelEnv !== 'production'" />
          <v-btn-primary to="/builder" size="large" class="px-8" height="40">
            {{ t('header.createButton') }}
          </v-btn-primary>
        </div>
      </v-col>

      <v-col v-if="datatableRef?.activeFiltersList?.length > 0" cols="12" class="pb-2 px-0">
        <div class="active-filters-container">
          <span class="active-filters-label">Active filters:</span>

          <div class="active-filters-badges">
            <HomeFilterBadge
              v-for="(filter, index) in datatableRef.activeFiltersList"
              :key="`${filter.type}-${index}`"
              :label="filter.label"
              @remove="datatableRef.removeFilter(filter)"
            />
          </div>

          <div class="clear-all-divider" />

          <span class="clear-all-text" @click="datatableRef.clearAllFilters()">Clear all</span>
        </div>
      </v-col>

      <v-col cols="12" class="pb-0 px-0">
        <v-tabs
          v-model="activeTab"
          density="compact"
          hide-slider
          :selected-class="`bg-${tabsColors[activeTab]} font-weight-bold`"
        >
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            value="all"
          >
            {{ t('tabs.all') }}
          </v-tab>
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            value="real"
          >
            {{ t('tabs.real') }}
          </v-tab>
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            value="test"
          >
            {{ t('tabs.test') }}
          </v-tab>
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            value="training"
          >
            {{ t('tabs.training') }}
          </v-tab>
        </v-tabs>
      </v-col>

      <template v-if="filteredByTabAuctions && filteredByTabAuctions.length > 0">
        <v-col cols="12" class="datatable-col px-0 pt-0">
          <HomeAuctionsDatatable
            ref="datatableRef"
            v-model:page="page"
            v-model:global-search="globalSearch"
            v-model:dropdown-filters="dropdownFilters"
            v-model:sort-by="sortBy"
            :selectable="isAdmin || isBuyer"
            :loading="datatableLoading"
            :auctions="filteredByTabAuctions"
            @update:filtered-count="updateFilteredCount"
            @duplicated="handleAuctionDuplicated"
            @deleted="handleAuctionDeleted"
          />
        </v-col>

        <v-col cols="12" class="d-flex justify-center">
          <div style="max-width: 600px">
            <v-pagination
              v-model="page"
              color="grey"
              class="custom-pagination"
              :length="pageNumber"
            />
          </div>
        </v-col>
      </template>
      <v-col v-else cols="12" class="my-16 d-flex flex-column justify-center align-center ga-4">
        <v-img src="/images/no-auction_2.png" height="165" width="165" />
        <div class="text-h6">
          {{ t('empty.title') }}
        </div>
        <div class="w-50 text-center text-grey text-body-1">
          {{ t('empty.message') }}
        </div>
      </v-col>
    </v-row>
    <v-row v-else justify="center" align="center" class="h-screen">
      <v-progress-circular indeterminate :size="128" color="grey" />
    </v-row>
  </v-container>
</template>

<script setup>
import dayjs from 'dayjs'
import { ref, watch } from 'vue'

const config = useRuntimeConfig()

const { profile, getSession, isAdmin, isBuyer } = useUser()

const supabase = useSupabaseClient()
const router = useRouter()
const route = useRoute()
const { width } = useDisplay()
// No need for localePath anymore

// Use translations
const { t } = useTranslations()

const totalAuctionsCount = ref(0)
const formatedAuction = ref([])
const page = ref(1)
const loading = ref(true)
const datatableLoading = ref(false)
const pageNumber = ref(0)
const filteredAuctionsCount = ref(0)
const datatableRef = ref(null)

// Tabs state
const activeTab = ref('all')
const tabsColors = {
  all: 'yellow-lighten-1',
  real: 'green-light',
  test: 'purple',
  training: 'sky',
  templates: 'orange-light-2'
}

// Filter auctions by tab
const filteredByTabAuctions = computed(() => {
  if (!formatedAuction.value) return []

  if (activeTab.value === 'all') {
    return formatedAuction.value
  }

  return formatedAuction.value.filter((auction) => {
    switch (activeTab.value) {
      case 'real':
        return auction.usage === 'real'
      case 'test':
        return auction.usage === 'test'
      case 'training':
        return auction.usage === 'training'
      default:
        return true
    }
  })
})

// Count for the chip badge
const displayedAuctionsCount = computed(() => {
  return filteredByTabAuctions.value.length
})

// Reset page when tab changes
watch(activeTab, () => {
  page.value = 1
})

// Filter and sort state
const globalSearch = ref('')
const dropdownFilters = ref({
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
})
const sortBy = ref([])

// Fonction pour mettre à jour le nombre de pages basé sur les items filtrés
const updateFilteredCount = (count) => {
  filteredAuctionsCount.value = count
  const PAGE_SIZE = 16
  pageNumber.value = Math.max(1, Math.ceil(count / PAGE_SIZE))

  // Si la page actuelle est supérieure au nombre de pages après filtrage, revenir à la page 1
  if (page.value > pageNumber.value) {
    page.value = 1
  }
}

// Handler pour rafraîchir la liste après duplication
const handleAuctionDuplicated = async () => {
  await getAuctions(true) // Reload avec skeleton loader
}

// Handler pour supprimer les enchères de la liste immédiatement
const handleAuctionDeleted = (groupIds) => {
  formatedAuction.value = formatedAuction.value.filter(
    (auction) => !groupIds.includes(auction.auctions_group_settings_id)
  )
}

const fillInfosNeeded = ref(false)
const showEditDialog = ref(false)

watch(
  profile,
  () => {
    fillInfosNeeded.value =
      profile.value?.email &&
      (!profile.value?.companies?.address ||
        !profile.value?.companies?.country ||
        !profile.value?.companies?.name ||
        !profile.value?.companies?.legal_id ||
        !profile.value?.phone ||
        !profile.value?.first_name ||
        !profile.value?.last_name ||
        !profile.value?.position)

    showEditDialog.value = fillInfosNeeded.value
  },
  { deep: true }
)

// URL Synchronization Functions
function parseUrlParams() {
  const query = route.query

  // Helper to parse simple comma-separated lists from URL (no JSON, no manual encoding)
  const parseList = (param) => {
    if (!param) return []
    return String(param)
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  }

  // Helper to parse sort configuration stored as "key:asc,key2:desc"
  const parseSort = (param) => {
    if (!param) return []
    return String(param)
      .split(',')
      .map((token) => {
        const [key, order] = token.split(':')
        if (!key) return null
        return {
          key,
          order: order === 'desc' ? 'desc' : 'asc'
        }
      })
      .filter(Boolean)
  }

  return {
    tab: query.tab || 'all',
    search: query.search || '',
    page: query.page ? parseInt(query.page, 10) : 1,
    filters: {
      clients: parseList(query.clients),
      types: parseList(query.types),
      usages: parseList(query.usages),
      owners: parseList(query.owners),
      statuses: parseList(query.statuses),
      dateFilter: {
        type: query.dateFilterType || null,
        date: query.dateFilterValue || null,
        startDate: query.dateFilterStart || null,
        endDate: query.dateFilterEnd || null
      }
    },
    sort: parseSort(query.sort)
  }
}

function buildUrlParams() {
  const params = {}

  // Add tab if not default
  if (activeTab.value && activeTab.value !== 'all') {
    params.tab = activeTab.value
  }

  // Add global search
  if (globalSearch.value) {
    params.search = globalSearch.value
  }

  // Add page if not default
  if (page.value && page.value !== 1) {
    params.page = page.value.toString()
  }

  // Add dropdown filters as simple comma-separated lists (no manual encoding)
  if (dropdownFilters.value.clients.length > 0) {
    params.clients = dropdownFilters.value.clients.join(',')
  }
  if (dropdownFilters.value.types.length > 0) {
    params.types = dropdownFilters.value.types.join(',')
  }
  if (dropdownFilters.value.usages.length > 0) {
    params.usages = dropdownFilters.value.usages.join(',')
  }
  if (dropdownFilters.value.owners.length > 0) {
    params.owners = dropdownFilters.value.owners.join(',')
  }
  if (dropdownFilters.value.statuses.length > 0) {
    params.statuses = dropdownFilters.value.statuses.join(',')
  }

  // Add date filter
  if (dropdownFilters.value.dateFilter.type) {
    params.dateFilterType = dropdownFilters.value.dateFilter.type
    if (
      dropdownFilters.value.dateFilter.type === 'before' ||
      dropdownFilters.value.dateFilter.type === 'after'
    ) {
      if (dropdownFilters.value.dateFilter.date) {
        params.dateFilterValue = dropdownFilters.value.dateFilter.date
      }
    } else if (dropdownFilters.value.dateFilter.type === 'between') {
      if (dropdownFilters.value.dateFilter.startDate) {
        params.dateFilterStart = dropdownFilters.value.dateFilter.startDate
      }
      if (dropdownFilters.value.dateFilter.endDate) {
        params.dateFilterEnd = dropdownFilters.value.dateFilter.endDate
      }
    }
  }

  // Add sort as "key:asc,key2:desc"
  if (sortBy.value.length > 0) {
    params.sort = sortBy.value.map((s) => `${s.key}:${s.order || 'asc'}`).join(',')
  }

  return params
}

// Flag to prevent infinite loops between URL and state watchers
let isUpdatingFromUrl = false
let isUpdatingFromState = false

// Watch route.query changes (browser back/forward) and update state
watch(
  () => route.query,
  (newQuery) => {
    if (isUpdatingFromState) return // Skip if update came from state change

    isUpdatingFromUrl = true
    const urlParams = parseUrlParams()

    activeTab.value = urlParams.tab
    globalSearch.value = urlParams.search
    page.value = urlParams.page
    dropdownFilters.value = urlParams.filters
    sortBy.value = urlParams.sort

    nextTick(() => {
      isUpdatingFromUrl = false
    })
  },
  { deep: true }
)

// Synchronize state changes to URL (debounced for search)
const { watchDebounced } = await import('@vueuse/core')

watchDebounced(
  globalSearch,
  () => {
    if (isUpdatingFromUrl) return // Skip if update came from URL change

    isUpdatingFromState = true
    router.replace({ query: buildUrlParams() })
    nextTick(() => {
      isUpdatingFromState = false
    })
  },
  { debounce: 300 }
)

watch(
  [page, dropdownFilters, sortBy, activeTab],
  () => {
    if (isUpdatingFromUrl) return // Skip if update came from URL change

    isUpdatingFromState = true
    router.replace({ query: buildUrlParams() })
    nextTick(() => {
      isUpdatingFromState = false
    })
  },
  { deep: true }
)

// CAll
const PAGE_SIZE = 16
const STATUS_PRIORITY = {
  active: 1,
  upcoming: 2,
  closed: 3,
  default: 4
}

const createBaseQuery = (supabase) => {
  return supabase.from('auctions_group_settings').select(
    `
      id,
      name,
      created_at,
      timing_rule,
      auctions!inner(
        *,
        users_auctions_status(is_favorite, is_archived),
        auctions_sellers(seller_email, time_per_round),
        profiles!buyer_id(*, companies(*))
      )
    `,
    { count: 'exact' }
  )
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
    // Real/test sealed-bid: active from creation (use created_at)
    // Training sealed-bid: controlled by Start Training button (use start_at)
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

// loadTable will activate the skeleton loader.
async function getAuctions(loadTable = false) {
  try {
    if (loadTable) {
      datatableLoading.value = true
    }

    const query = createBaseQuery(supabase)
      .eq('auctions.deleted', false)
      .order('created_at', { ascending: false })

    const { data: auctionsGroup, count, error } = await query
    if (error) throw error
    totalAuctionsCount.value = count

    const filteredAuctions = auctionsGroup
      .filter((group) => !group.auctions[0].users_auctions_status?.[0]?.is_archived)
      .map(processAuctionGroup)

    formatedAuction.value = filteredAuctions
    pageNumber.value = Math.max(1, Math.ceil(filteredAuctions.length / PAGE_SIZE))
    if (page.value > pageNumber.value) {
      page.value = pageNumber.value
    }
  } catch (error) {
    console.error('Error fetching auctions:', error)
  } finally {
    datatableLoading.value = false
    loading.value = false
  }
}

// Initialize state from URL params on page load
const urlParams = parseUrlParams()
activeTab.value = urlParams.tab
globalSearch.value = urlParams.search
page.value = urlParams.page
dropdownFilters.value = urlParams.filters
sortBy.value = urlParams.sort

// Si un company ID est passé en paramètre, le convertir en filtre client normal
if (route.query.company && !urlParams.filters.clients.length) {
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', route.query.company)
    .single()

  if (company?.name) {
    dropdownFilters.value.clients = [company.name]
    // Remplacer l'URL pour utiliser le système de filtres normal
    router.replace({ query: buildUrlParams() })
  }
}

await getSession().then(async ({ user }) => {
  if (!user) {
    loading.value = true
    router.push('/auth/signin')
  } else {
    await getAuctions(true)
  }
})

const { subscribedData: auctionsSellers } = useRealtime({
  table: 'auctions_sellers',
  filter: `seller_email=eq.${profile.value?.email || ''}`
})

const { subscribedData: usersAuctionsStatus } = useRealtime({
  table: 'users_auctions_status',
  filter: `user_id=eq.${profile.value?.id || ''}`
})

const { subscribedData: auctions } = useRealtime({
  table: 'auctions',
  filter: `created_at=gt.${dayjs().toISOString()}`
})

// Debounce realtime updates to prevent query flood
let realtimeDebounceTimeout = null
watch(
  [auctionsSellers, usersAuctionsStatus, auctions],
  () => {
    // Debounce to prevent multiple rapid calls when realtime events fire
    if (realtimeDebounceTimeout) {
      clearTimeout(realtimeDebounceTimeout)
    }
    realtimeDebounceTimeout = setTimeout(() => {
      getAuctions()
    }, 1000) // Wait 1 second after last realtime event
  },
  { deep: true }
)
</script>

<style scoped>
.medal {
  width: 60px;
  height: 60px;
  margin-bottom: -30px;
  z-index: 100;
  position: relative;
}

/* Global search styling */
.global-search-field:deep(.v-field) {
  border-radius: 4px;
}

/* Pagination */
.custom-pagination:deep(.v-pagination__item--is-active:hover) {
  background-color: rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.custom-pagination:deep(.v-pagination__item--is-active .v-btn__content) {
  color: rgb(var(--v-theme-grey)) !important;
  z-index: 9999 !important;
}
.custom-pagination:deep(.v-pagination__item--is-active .v-btn__overlay) {
  background-color: white !important;
}

/* Tabs styling */
.custom-tab-border {
  border-radius: 4px 4px 0 0 !important;
  border: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-bottom: none !important;
  background: white;
}

/* Active filters badges */
.active-filters-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-filters-label {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  color: #1d1d1b;
  white-space: nowrap;
}

.active-filters-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.clear-all-divider {
  width: 1px;
  height: 24px;
  background: #e9eaec;
  flex-shrink: 0;
}

.clear-all-text {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  color: #1d1d1b;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.clear-all-text:hover {
  opacity: 0.7;
}
</style>
