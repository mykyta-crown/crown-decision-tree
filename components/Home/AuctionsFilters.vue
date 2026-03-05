<template>
  <v-row>
    <v-col cols="12" md="auto" class="d-flex align-end pt-2">
      <v-text-field
        v-model="search"
        hide-details
        :placeholder="t('auction.search.placeholder')"
        style="width: 285px"
      >
        <template #prepend-inner>
          <v-img src="@/assets/icons/basic/Search.svg" width="20" height="20" />
        </template>
      </v-text-field>
    </v-col>
    <v-col cols="6" md="2" class="pt-2">
      <v-select
        v-model="selectedType"
        hide-details
        :label="t('auction.type.label')"
        :items="typeItems"
        :menu-icon="null"
      >
        <template #append-inner>
          <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
        </template>
      </v-select>
    </v-col>
    <v-col cols="6" md="2" class="pt-2">
      <v-select
        v-model="selectedUsage"
        hide-details
        :label="t('auction.usage.label')"
        :items="usageItems"
        :menu-icon="null"
      >
        <template #append-inner>
          <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
        </template>
      </v-select>
    </v-col>
    <v-col cols="6" md="2" class="pt-2">
      <v-select
        v-model="selectedStatus"
        hide-details
        :label="t('auction.status.label')"
        :items="statusItems"
        :menu-icon="null"
      >
        <template #append-inner>
          <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
        </template>
      </v-select>
    </v-col>
    <v-col cols="6" md="2" class="pt-2">
      <v-select
        v-model="selectedSort"
        hide-details
        :label="t('auction.sort.label')"
        :items="sortItems"
        :menu-icon="null"
      >
        <template #append-inner>
          <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
        </template>
      </v-select>
    </v-col>
    <v-col cols="12" md="1" class="d-flex align-end justify-end">
      <v-btn
        :class="displayType === 'cards' ? 'bg-white' : ''"
        icon
        variant="plain"
        size="40"
        rounded="lg"
        @click="setDisplayType('cards')"
      >
        <v-img :src="GridIcon" width="40" height="40" alt="Grid view" />
      </v-btn>
      <v-btn
        :class="displayType === 'list' ? 'bg-white' : ''"
        icon
        variant="plain"
        rounded="lg"
        size="40"
        @click="setDisplayType('list')"
      >
        <v-img :src="ListIcon" width="40" height="40" alt="List view" />
      </v-btn>
    </v-col>
  </v-row>
</template>
<script setup>
import GridIcon from '~/assets/icons/basic/layout-grid.svg'
import ListIcon from '~/assets/icons/basic/stretch-horizontal.svg'

// import dayjs from 'dayjs'
// const props = defineProps(['auctions'])

// const emit = defineEmits(['filter'])

const router = useRouter()
const route = useRoute()

// Use translations
const { t } = useTranslations()

const displayType = defineModel('displayType')

const selectedType = ref(route.query.type || null)
const selectedUsage = ref(route.query.usage || null)
const selectedStatus = ref(route.query.status || null)
const selectedSort = ref(route.query.sort || null)
const search = ref(route.query.search || null)

// Computed properties for translated items
const typeItems = computed(() => [
  { title: t('auction.type.all'), value: null },
  { title: t('auction.type.dutch'), value: 'dutch' },
  { title: t('auction.type.english'), value: 'reverse' },
  { title: t('auction.type.japanese'), value: 'japanese' },
  { title: t('auction.type.sealedBid'), value: 'sealed-bid' }
])

const usageItems = computed(() => [
  { title: t('auction.usage.all'), value: null },
  { title: t('auction.usage.real'), value: 'real' },
  { title: t('auction.usage.training'), value: 'training' },
  { title: t('auction.usage.test'), value: 'test' }
])

const statusItems = computed(() => [
  { title: t('auction.status.all'), value: null },
  { title: t('auction.status.upcoming'), value: 'upcoming' },
  { title: t('auction.status.active'), value: 'active' },
  { title: t('auction.status.draft'), value: 'draft' },
  { title: t('auction.status.closed'), value: 'closed' }
])

const sortItems = computed(() => [
  { title: t('auction.sort.default'), value: null },
  { title: t('auction.sort.newest'), value: 'newest' },
  { title: t('auction.sort.oldest'), value: 'oldest' },
  { title: t('auction.sort.atoz'), value: 'atoz' },
  { title: t('auction.sort.ztoa'), value: 'ztoa' },
  { title: t('auction.sort.favorites'), value: 'favorites' }
])

// const sortFavorites = (a, b) => {
//   const aFavorite = a.users_auctions_status[0]?.is_favorite ?? 0;
//   const bFavorite = b.users_auctions_status[0]?.is_favorite ?? 0;
//   return bFavorite - aFavorite;
// }

// const filteredAuctions = computed(() => {
//   return props.auctions.filter((auction) => {
//     return (!selectedType.value || auction.type === selectedType.value) &&
//       (!selectedUsage.value || auction.usage === selectedUsage.value) &&
//       (!selectedStatus.value || auction.status.label === selectedStatus.value) &&
//       (!search.value || auction.name.toLowerCase().includes(search.value.toLowerCase()) || auction.profiles?.companies.name.toLowerCase().includes(search.value.toLowerCase()));
//   })
// })

// const sortedAuctions = computed(() => {
//   return filteredAuctions.value.map((a) => a).sort((a, b) => {
//     switch (selectedSort.value) {
//     case 'newest':
//       return dayjs(b.created_at).diff(a.created_at);
//     case 'oldest':
//       return dayjs(a.created_at).diff(b.created_at);
//     case 'favorites':
//       return sortFavorites(a, b);
//     case 'atoz':
//       return a.name.localeCompare(b.name);
//     case 'ztoa':
//       return b.name.localeCompare(a.name);
//     default:
//       return 0;
//     }
//   })
// })

const setDisplayType = (type) => {
  localStorage.setItem('displayType', type)
  displayType.value = type
}

const query = computed(() => {
  const params = {
    search: search.value?.length > 0 ? search.value : null,
    type: selectedType.value,
    usage: selectedUsage.value,
    status: selectedStatus.value,
    sort: selectedSort.value
  }
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value != null))
})

watch([query], () => {
  router.push({
    path: '/home',
    query: query.value
  })
})

// emit('filter', sortedAuctions.value)
</script>

<style scoped>
:deep(.v-field-label) {
  font-size: 14px !important;
  color: rgb(var(--v-theme-grey)) !important;
}
</style>
