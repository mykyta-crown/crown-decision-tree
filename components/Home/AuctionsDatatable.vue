<template>
  <v-data-table
    id="table"
    v-model="selectedRows"
    v-model:page="page"
    v-model:sort-by="sortBy"
    :headers="headers"
    :hover="true"
    :items="filteredAuctions"
    :items-per-page="itemsPerPage"
    class="bg-none custom-data-table-in-tabs"
    hide-default-footer
    :show-select="isBuyer && props.selectable"
    :loading="loading"
    :item-value="(item) => item.auctions_group_settings_id"
    multi-sort
  >
    <template #loading>
      <v-skeleton-loader class="custom-skeleton" type="table-row@16" />
    </template>
    <template v-if="props.selectable && isBuyer" #[`header.data-table-select`]>
      <v-checkbox-btn
        v-if="
          (headerIndeterminate === 'indeterminate' || headerIndeterminate === 'default') &&
          selectedRows.length !== filteredAuctions.length
        "
        v-model="checkingHeader"
        :indeterminate="isCheckboxIndeterminate"
        hide-details
        color="primary"
        @click.stop="toggleCheckboxState"
      />
      <v-checkbox-btn
        v-else
        :model-value="true"
        hide-details
        :indeterminate="selectedRows.length !== filteredAuctions.length"
        color="primary"
        @click.stop="emptySelection"
      />
    </template>

    <!-- Name Header -->
    <template #[`header.name`]="{ column }">
      <NameHeaderSort
        :column="column"
        :is-active="isHeaderActive(column.key)"
        :is-sorted-asc="isSortedAsc(column.key)"
        :is-sorted-desc="isSortedDesc(column.key)"
        @sort="applySort"
      />
    </template>

    <!-- Client Header with Search and Dropdown Filter -->
    <template #[`header.client`]="{ column }">
      <ColumnHeaderFilter
        :column="column"
        :is-active="isHeaderActive(column.key)"
        :is-sorted-asc="isSortedAsc(column.key)"
        :is-sorted-desc="isSortedDesc(column.key)"
        :has-search="true"
        :search-value="columnFilters.client"
        :items="uniqueClients"
        :selected-items="dropdownFilters.clients"
        :sort-asc-label="t('components.auctionsDatatable.sortAtoZ')"
        :sort-desc-label="t('components.auctionsDatatable.sortZtoA')"
        @sort="applySort"
        @update:search-value="columnFilters.client = $event"
        @update:selected-items="dropdownFilters.clients = $event"
        @clear="handleClearClientFilter(column.key)"
      />
    </template>

    <!-- Date Header with Dropdown Filter -->
    <template #[`header.date`]="{ column }">
      <ColumnHeaderFilter
        :column="column"
        :is-active="isHeaderActive(column.key)"
        :is-sorted-asc="isSortedAsc(column.key)"
        :is-sorted-desc="isSortedDesc(column.key)"
        filter-type="date"
        :date-filter="dropdownFilters.dateFilter"
        sort-asc-icon="mdi-sort-calendar-ascending"
        sort-desc-icon="mdi-sort-calendar-descending"
        :sort-asc-label="t('components.auctionsDatatable.sortOldestFirst')"
        :sort-desc-label="t('components.auctionsDatatable.sortNewestFirst')"
        @sort="applySort"
        @update:date-filter="dropdownFilters.dateFilter = $event"
        @clear="handleClearDateFilter(column.key)"
      />
    </template>

    <!-- Type Header with Dropdown Filter -->
    <template #[`header.type`]="{ column }">
      <ColumnHeaderFilter
        :column="column"
        :is-active="isHeaderActive(column.key)"
        :is-sorted-asc="isSortedAsc(column.key)"
        :is-sorted-desc="isSortedDesc(column.key)"
        :items="uniqueTypes"
        :selected-items="dropdownFilters.types"
        item-value-key="value"
        item-label-key="label"
        :sort-asc-label="t('components.auctionsDatatable.sortAscending')"
        :sort-desc-label="t('components.auctionsDatatable.sortDescending')"
        @sort="applySort"
        @update:selected-items="dropdownFilters.types = $event"
        @clear="handleClearTypeFilter(column.key)"
      />
    </template>

    <!-- Owner Header with Search and Dropdown Filter -->
    <template #[`header.owner`]="{ column }">
      <ColumnHeaderFilter
        :column="column"
        :is-active="isHeaderActive(column.key)"
        :is-sorted-asc="isSortedAsc(column.key)"
        :is-sorted-desc="isSortedDesc(column.key)"
        :has-search="true"
        :search-value="columnFilters.owner"
        :items="uniqueOwners"
        :selected-items="dropdownFilters.owners"
        :sort-asc-label="t('components.auctionsDatatable.sortAtoZ')"
        :sort-desc-label="t('components.auctionsDatatable.sortZtoA')"
        @sort="applySort"
        @update:search-value="columnFilters.owner = $event"
        @update:selected-items="dropdownFilters.owners = $event"
        @clear="handleClearOwnerFilter(column.key)"
      />
    </template>

    <!-- Status Header with Dropdown Filter -->
    <template #[`header.status`]="{ column }">
      <ColumnHeaderFilter
        :column="column"
        :is-active="isHeaderActive(column.key)"
        :is-sorted-asc="isSortedAsc(column.key)"
        :is-sorted-desc="isSortedDesc(column.key)"
        :items="uniqueStatusesFormatted"
        :selected-items="dropdownFilters.statuses"
        item-value-key="value"
        item-label-key="label"
        :sort-asc-label="t('components.auctionsDatatable.sortAscending')"
        :sort-desc-label="t('components.auctionsDatatable.sortDescending')"
        @sort="applySort"
        @update:selected-items="dropdownFilters.statuses = $event"
        @clear="handleClearStatusFilter(column.key)"
      />
    </template>
    <template #item="{ index, item }">
      <tr
        :class="[
          hoveredRow === index ? 'bg-grey-deep' : 'bg-white',
          index === 0 ? 'custom-intercom-focus' : ''
        ]"
        @click="goToAuction(item)"
        @mouseover="ishovered(index)"
        @mouseleave="hoveredRow = null"
      >
        <td v-if="props.selectable" class="pr-0 pl-2">
          <Transition name="slide-fade">
            <v-checkbox-btn
              v-model="selectedRows"
              :value="item.auctions_group_settings_id"
              hide-details
              color="primary"
              class="custom-checkbox-color"
              @click.stop
            />
          </Transition>
        </td>
        <td class="auction-name-cell" :class="props.selectable ? 'pl-0' : 'pl-4'">
          <v-tooltip activator="parent" location="top left" content-class="bg-white border">
            {{ item.name }}
          </v-tooltip>
          {{ item.name }}
        </td>
        <td class="truncate-cell">
          <v-tooltip activator="parent" location="top left" content-class="bg-white border">
            {{ item.client }}
          </v-tooltip>
          {{ item.client }}
        </td>
        <td class="text-no-wrap">
          <v-tooltip location="top">
            <template #activator="{ props: tooltipProps }">
              <span v-bind="tooltipProps">{{ item.date }}</span>
            </template>
            {{ formatFullDate(item.start_at) }}
          </v-tooltip>
        </td>
        <td>
          <div class="d-flex align-center justify-space-between ga-2">
            <span>{{ getSubType(item) }}</span>
            <div
              v-if="item.isMultilot"
              class="bg-grey-lighten-4 round-icon d-flex justify-center align-center pa-1"
            >
              <v-tooltip activator="parent">
                {{ firstLetterUppercase(item.timing_rule) }}
              </v-tooltip>
              <img class="green" :src="`/builder/${item.timing_rule}-icon.svg`" height="18px" />
            </div>
          </div>
        </td>
        <td class="truncate-cell">
          <v-tooltip activator="parent" location="top left" content-class="bg-white border">
            {{ item.owner }}
          </v-tooltip>
          {{ item.owner }}
        </td>
        <td class="d-flex justify-center align-center">
          <!--
            <v-chip
            class="d-flex justify-center align-center"
            :color="item.status.color"
            variant="flat"
            label
            size="small"
            >
            {{ firstLetterUppercase(item.status.label) }}
            </v-chip>
          -->
          <div class="text-center text-body-2 custom-chip" :class="`bg-${item.status.color}`">
            {{ t(`status.${item.status.label}`) }}
          </div>
        </td>
        <td>
          <div class="d-flex align-center justify-end ga-3">
            <AuctionsInputsFavoriteIcon :auction="item" />
            <AuctionsInputsOptionsMenu
              :is-home="props.selectable"
              :auction="item"
              @delete="toggleDelete"
              @duplicated="$emit('duplicated')"
            />
          </div>
        </td>
      </tr>
    </template>
  </v-data-table>
  <!-- Teleport this btn next to "Create eAuction " -->
  <Teleport
    v-if="isAdmin && isBuyer && isTeleportTargetMounted && props.selectable"
    to="#delete-btn-position"
    defer
  >
    <Transition name="btn">
      <div v-show="selectedRows.length >= 1" :key="1">
        <span class="mr-4 text-h6"
          >{{ selectedRows.length }}
          {{
            selectedRows.length > 1
              ? t('components.auctionsDatatable.selection.multiple')
              : t('components.auctionsDatatable.selection.single')
          }}</span
        >
        <v-btn
          size="large"
          class="px-8 mr-4"
          color="error"
          height="40"
          @click.stop="deleteDialog = true"
        >
          {{ t('components.auctionsDatatable.deleteButton') }}
        </v-btn>
      </div>
    </Transition>
  </Teleport>
  <AuctionsInputsDeleteDialog
    v-model="deleteDialog"
    :group-id-list="selectedRows"
    @delete="handleDeleted"
    @cancel="cancelDeletion()"
  />
</template>
<script setup>
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/en'
import 'dayjs/locale/fr'
import { useTableSort } from '~/composables/useTableSort'
import { useTableFilters } from '~/composables/useTableFilters'
import { useTableSelection } from '~/composables/useTableSelection'
import { useAuctionFormatting } from '~/composables/useAuctionFormatting'
import FilterBadge from '~/components/Home/FilterBadge.vue'
import NameHeaderSort from '~/components/Home/NameHeaderSort.vue'
import ColumnHeaderFilter from '~/components/Home/ColumnHeaderFilter.vue'

const props = defineProps({
  auctions: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectable: {
    type: Boolean,
    default: false
  }
})
// Emit pour informer le parent du nombre d'items filtrés, de la duplication et de la suppression
const emit = defineEmits(['update:filteredCount', 'duplicated', 'deleted'])
dayjs.extend(localizedFormat)
const page = defineModel('page')
const globalSearch = defineModel('globalSearch', { default: '' })
const dropdownFilters = defineModel('dropdownFilters', {
  default: () => ({
    clients: [],
    types: [],
    usages: [],
    owners: [],
    statuses: [],
    dateFilter: {
      type: null, // 'before' | 'after' | 'between' | null
      date: null, // For 'before' and 'after'
      startDate: null, // For 'between'
      endDate: null // For 'between'
    }
  })
})
const sortBy = defineModel('sortBy', { default: () => [] })

const router = useRouter()

// Use translations
const { t, locale } = useTranslations()

// Set dayjs locale based on current language and watch for changes
watchEffect(() => {
  dayjs.locale(locale.value)
})

const deleteDialog = ref(false)

// Initialize composables
const {
  firstLetterUppercase,
  getSubType,
  formatFullDate,
  formattedAuctions,
  uniqueClients,
  uniqueTypes,
  uniqueUsages,
  uniqueOwners,
  uniqueStatuses
} = useAuctionFormatting(toRef(props, 'auctions'), t)

const { applySort, clearSort, getSortState, isSortedAsc, isSortedDesc, isSorted } =
  useTableSort(sortBy)

const headers = computed(() => [
  {
    title: t('components.auctionsDatatable.headers.name'),
    key: 'name',
    value: 'name',
    sortable: true,
    headerProps: {
      class: props.selectable ? 'pl-0' : 'pl-4'
    }
  },
  { title: t('components.auctionsDatatable.headers.company'), key: 'client', sortable: true },
  {
    title: t('components.auctionsDatatable.headers.scheduledFor'),
    key: 'date',
    value: 'start_at',
    sortable: true
  },
  { title: t('components.auctionsDatatable.headers.type'), key: 'type', sortable: true },
  { title: t('components.auctionsDatatable.headers.owner'), key: 'owner', sortable: true },
  {
    title: t('components.auctionsDatatable.headers.status'),
    key: 'status',
    value: 'status.label',
    sortable: true,
    align: 'center'
  },
  { key: 'actions', sortable: false }
])

const {
  columnFilters,
  filteredAuctions,
  formatDateForDisplay,
  activeFiltersList,
  clearAllFilters,
  removeFilter,
  selectDateFilterType,
  isHeaderActive
} = useTableFilters(formattedAuctions, globalSearch, dropdownFilters, sortBy, headers, t)

const {
  selectedRows,
  checkingHeader,
  headerIndeterminate,
  isCheckboxIndeterminate,
  toggleCheckboxState,
  emptySelection,
  toggleDelete,
  cancelDeletion,
  syncSelectedRowsWithFiltered
} = useTableSelection(filteredAuctions)

// Format usages and statuses for dropdown filters
const uniqueUsagesFormatted = computed(() => {
  return uniqueUsages.value.map((usage) => ({
    value: usage,
    label: t(`auction.usage.${usage}`) || usage
  }))
})

const uniqueStatusesFormatted = computed(() => {
  return uniqueStatuses.value.map((status) => ({
    value: status,
    label: t(`status.${status}`) || status
  }))
})

// const page = ref(1)
const itemsPerPage = ref(16)

const hoveredRow = ref(null)
const ishovered = (id) => {
  hoveredRow.value = id
}

watch(
  filteredAuctions,
  () => {
    syncSelectedRowsWithFiltered()

    // Émettre le nombre d'items filtrés au parent pour la pagination
    emit('update:filteredCount', filteredAuctions.value.length)
  },
  { immediate: true }
)

const { isAdmin, isBuyer } = useUser()

const isTeleportTargetMounted = ref(false)

onMounted(() => {
  isTeleportTargetMounted.value = !!document.getElementById('delete-btn-position')

  // Émettre le nombre initial d'items filtrés
  emit('update:filteredCount', filteredAuctions.value.length)
})

const goToAuction = (item) => {
  const toRoute = `/auctions/${item.auctions_group_settings_id}/lots/${item.auction_id}/${isBuyer.value ? 'buyer' : 'supplier'}${'?type=' + item.type}${item.isMultilot ? '&multilot=true' : ''}`
  router.push(toRoute)
}

// Handle deletion - clear selection and notify parent
const handleDeleted = (deletedGroupIds) => {
  selectedRows.value = []
  emit('deleted', deletedGroupIds)
}

// Clear filter handlers
const handleClearClientFilter = (columnKey) => {
  clearSort(columnKey)
  dropdownFilters.value.clients = []
}

const handleClearDateFilter = (columnKey) => {
  clearSort(columnKey)
  dropdownFilters.value.dateFilter = { type: null, date: null, startDate: null, endDate: null }
}

const handleClearTypeFilter = (columnKey) => {
  clearSort(columnKey)
  dropdownFilters.value.types = []
}

const handleClearUsageFilter = (columnKey) => {
  clearSort(columnKey)
  dropdownFilters.value.usages = []
}

const handleClearOwnerFilter = (columnKey) => {
  clearSort(columnKey)
  dropdownFilters.value.owners = []
}

const handleClearStatusFilter = (columnKey) => {
  clearSort(columnKey)
  dropdownFilters.value.statuses = []
}

// Expose active filters for parent component
defineExpose({
  activeFiltersList,
  removeFilter,
  clearAllFilters
})
</script>

<style scoped>
.custom-skeleton:deep(.v-skeleton-loader__text) {
  background-color: rgb(var(--v-theme-grey-ligthen-1)) !important;
}

.bg-grey-deep:deep(td) {
  background-color: rgb(var(--v-theme-grey-ligthen-3)) !important;
}
.bg-none {
  background-color: transparent;
}
.v-table > .v-table__wrapper > table > tbody > tr > td {
  height: 44px !important;
}
.custom-data-table:deep(th),
.custom-checkbox-color {
  font-size: 14px !important;
  color: rgb(var(--v-theme-grey));
  border: none !important;
  white-space: nowrap;
  font-weight: 400 !important;
  height: 44px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.custom-data-table:deep(thead) {
  height: 44px !important;
}

.custom-data-table:deep(thead tr) {
  height: 44px !important;
}

.custom-data-table:deep(table) {
  border-spacing: 0 !important;
  border-collapse: separate !important;
}

.custom-data-table:deep(tbody) {
  margin-top: 0 !important;
}

.custom-data-table:deep(thead tr th) {
  border-bottom: none !important;
}

.custom-data-table:deep(tbody tr:first-child td) {
  padding-top: 0 !important;
}

.custom-data-table:deep(hr) {
  display: none;
}

.custom-data-table:deep(td) {
  color: rgb(var(--v-theme-primary));
  font-size: 14px !important;
  background-color: white;
}
.custom-data-table:deep(td:first-child) {
  border-top-left-radius: 4px !important;
  border-bottom-left-radius: 4px !important;
}

.custom-data-table:deep(td:last-child) {
  border-top-right-radius: 4px !important;
  border-bottom-right-radius: 4px !important;
}

.custom-data-table:deep(tbody tr:hover) {
  cursor: pointer !important;
}

.v-table .v-table__wrapper > table > tbody > tr > td {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  /* border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important; */
}

.v-table .v-table__wrapper > table > tbody > tr:first-child > td {
  border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.v-table .v-table__wrapper > table > tbody > tr > td:first-child {
  border-left: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.v-table .v-table__wrapper > table > tbody > tr > td:last-child {
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.round-icon {
  border-radius: 5px;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.btn-move, /* apply transition to moving elements */
.btn-enter-active,
.btn-leave-active {
  transition: all 0.5s ease;
}

.btn-enter-from,
.btn-leave-to {
  opacity: 0;
  transform: translateY(40px);
}
.btn-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}

.custom-data-table-in-tabs:deep(th) {
  font-size: 14px !important;
  height: 37px !important;
  font-weight: 400 !important;
  color: rgb(var(--v-theme-grey));
  background-color: white;
  border: none !important;
  border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  white-space: nowrap;
}

.custom-data-table-in-tabs:deep(thead) {
  height: 37px !important;
  background-color: white !important;
}

.custom-data-table-in-tabs:deep(thead tr) {
  height: 37px !important;
  background-color: white !important;
}

.custom-data-table-in-tabs:deep(table) {
  border-spacing: 0 !important;
  border-collapse: separate !important;
}

.custom-data-table-in-tabs:deep(tbody) {
  margin-top: 0 !important;
}

.custom-data-table-in-tabs:deep(hr) {
  display: none;
}

.custom-data-table-in-tabs:deep(td) {
  color: rgb(var(--v-theme-primary));
  font-size: 14px !important;
  background-color: white;
}

.custom-data-table-in-tabs:deep(tbody > tr:first-child > td) {
  border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.custom-data-table-in-tabs:deep(tbody > tr:last-child > td) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.custom-data-table-in-tabs:deep(td:first-child),
.custom-data-table-in-tabs:deep(th:first-child) {
  border-top-left-radius: 4px !important;
  border-bottom-left-radius: 4px !important;
  border-left: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.custom-data-table-in-tabs:deep(th:first-child) {
  border-top-left-radius: 0px !important;
}

.custom-data-table-in-tabs:deep(td:last-child),
.custom-data-table-in-tabs:deep(th:last-child) {
  border-top-right-radius: 4px !important;
  border-bottom-right-radius: 4px !important;
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.custom-data-table-in-tabs:deep(th:last-child) {
  border-top-right-radius: 0px !important;
}

.custom-data-table-in-tabs:deep(tbody tr:hover) {
  cursor: pointer !important;
}

.truncate-cell {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auction-name-cell {
  min-width: 250px;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-chip {
  width: 80px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Active filters badges */
.active-filters-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px 12px 16px;
}

.active-filters-label {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
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
  line-height: 1.5;
  color: #787878;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.clear-all-text:hover {
  opacity: 0.7;
}
</style>
