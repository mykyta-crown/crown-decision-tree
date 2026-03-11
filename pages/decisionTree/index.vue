<template>
  <v-container fluid class="list-page">
    <!-- Header -->
    <v-row align="center" class="mb-2">
      <v-col cols="auto" class="d-flex align-center ga-3">
        <h1 class="text-h5 font-weight-bold">{{ t('page.title') }}</h1>
        <v-chip size="small" color="primary" variant="flat" label>
          {{ projectsStore.allActive.length }}
        </v-chip>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="d-flex align-center ga-3">
        <v-btn
          variant="text"
          color="#6B7280"
          prepend-icon="mdi-help-circle-outline"
          class="how-btn"
          @click="showHowItWorks = true"
        >
          {{ t('page.howItWorks') }}
        </v-btn>
        <v-text-field
          v-model="projectsStore.search"
          :placeholder="t('page.search')"
          density="compact"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-magnify"
          :clearable="!!projectsStore.search"
          style="min-width: 300px"
        />
      </v-col>
    </v-row>

    <!-- How does it work dialog -->
    <DecisionTreeCalculatorHowItWorksDialog v-model="showHowItWorks" @start="createNewGuided" />

    <!-- Toolbar -->
    <v-row align="center" class="mb-6">
      <v-col cols="auto" class="d-flex align-center ga-2">
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-file-tree"
          @click="showTreeV1 = true"
        >
          {{ t('page.dt1') }}
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-waterfall"
          @click="showTreeV2 = true"
        >
          {{ t('page.dt2') }}
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-table-check"
          @click="showTreeV3 = true"
        >
          {{ t('page.dt3') }}
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-tune-variant"
          @click="showTreeV4 = true"
        >
          {{ t('page.dt4') }}
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-sitemap-outline"
          @click="showTreeV5 = true"
        >
          {{ t('page.dt5') }}
        </v-btn>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="d-flex align-center ga-3">
        <v-btn
          color="#1D1D1B"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="createNew"
        >
          {{ t('page.newScenario') }}
        </v-btn>
        <v-btn
          color="#34D399"
          variant="flat"
          prepend-icon="mdi-plus"
          class="guided-btn"
          @click="createNewGuided"
        >
          {{ t('page.newScenario') }}
        </v-btn>
        <v-btn
          color="#60A5FA"
          variant="flat"
          prepend-icon="mdi-plus"
          class="blue-btn"
          @click="createNewBlue"
        >
          {{ t('page.newScenario') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Active filters row -->
    <div v-if="activeFilters.length" class="active-filters mb-4">
      <div
        v-for="(af, i) in activeFilters"
        :key="i"
        class="filter-badge"
        @click="removeFilter(af)"
      >
        <span>{{ af.label }}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </div>
      <button class="clear-all-btn" @click="projectsStore.clearFilters()">
        {{ t('calc.clearAll') }}
      </button>
    </div>

    <!-- Base Table button moved to bottom of page -->

    <DecisionTreeCalculatorParamsModal v-if="calcStore.showParams" />
    <DecisionTreeCalculatorDecisionTreeV1 v-model="showTreeV1" />
    <DecisionTreeCalculatorDecisionTreeV2 v-model="showTreeV2" />
    <DecisionTreeCalculatorDecisionTreeV3 v-model="showTreeV3" />
    <DecisionTreeCalculatorDecisionTreeV4 v-model="showTreeV4" />
    <DecisionTreeCalculatorDecisionTreeV5 v-model="showTreeV5" />

    <!-- Table -->
    <v-card variant="outlined">
      <!-- Bulk action bar / Column headers (instant swap, no transition) -->
      <div v-if="projectsStore.selectedIds.size > 0" class="bulk-bar">
        <div class="bulk-check">
          <v-checkbox
            :model-value="true"
            hide-details
            density="compact"
            color="#1D1D1B"
            @click="projectsStore.deselectAll()"
          />
        </div>
        <div class="bulk-info">
          <span class="bulk-count">
            {{ projectsStore.selectedIds.size }} {{ t('page.selected') }}
          </span>
        </div>
        <v-btn
          variant="flat"
          color="#EF4444"
          size="small"
          prepend-icon="mdi-delete-outline"
          class="bulk-delete-btn"
          @click="confirmBulkDelete"
        >
          {{ t('page.deleteSelected') }}
        </v-btn>
      </div>

      <!-- Column headers -->
      <div v-else class="table-header">
        <div class="th th-check">
          <v-checkbox
            :model-value="projectsStore.allVisibleSelected"
            :indeterminate="projectsStore.someVisibleSelected"
            hide-details
            density="compact"
            color="#1D1D1B"
            @click="projectsStore.allVisibleSelected ? projectsStore.deselectAll() : projectsStore.selectAllVisible()"
          />
        </div>

        <!-- Name — sort only -->
        <HomeColumnHeaderFilter
          :column="{ title: t('calc.columns.name'), key: 'name' }"
          :is-active="isSorted('name')"
          :is-sorted-asc="isSortedDir('name', 'asc')"
          :is-sorted-desc="isSortedDir('name', 'desc')"
          filter-type="checkbox"
          :items="[]"
          sort-asc-icon="mdi-sort-alphabetical-ascending"
          sort-desc-icon="mdi-sort-alphabetical-descending"
          :sort-asc-label="t('calc.sort.az')"
          :sort-desc-label="t('calc.sort.za')"
          @sort="onSort"
          @clear="clearColumnFilter('name')"
        />

        <!-- Client -->
        <HomeColumnHeaderFilter
          :column="{ title: t('calc.columns.company'), key: 'client' }"
          :is-active="isSorted('client') || projectsStore.dropdownFilters.clients.length > 0"
          :is-sorted-asc="isSortedDir('client', 'asc')"
          :is-sorted-desc="isSortedDir('client', 'desc')"
          filter-type="checkbox"
          has-search
          :search-value="clientSearch"
          :items="projectsStore.uniqueClients"
          :selected-items="projectsStore.dropdownFilters.clients"
          sort-asc-icon="mdi-sort-alphabetical-ascending"
          sort-desc-icon="mdi-sort-alphabetical-descending"
          :sort-asc-label="t('calc.sort.az')"
          :sort-desc-label="t('calc.sort.za')"
          @sort="onSort"
          @update:search-value="clientSearch = $event || ''"
          @update:selected-items="projectsStore.dropdownFilters.clients = $event || []"
          @clear="clearColumnFilter('client')"
        />

        <!-- Created date -->
        <HomeColumnHeaderFilter
          :column="{ title: t('calc.columns.created'), key: 'created' }"
          :is-active="isSorted('created') || projectsStore.dropdownFilters.createdDateFilter.type !== null"
          :is-sorted-asc="isSortedDir('created', 'asc')"
          :is-sorted-desc="isSortedDir('created', 'desc')"
          filter-type="date"
          :date-filter="projectsStore.dropdownFilters.createdDateFilter"
          sort-asc-icon="mdi-sort-calendar-ascending"
          sort-desc-icon="mdi-sort-calendar-descending"
          :sort-asc-label="t('calc.sort.oldestFirst')"
          :sort-desc-label="t('calc.sort.newestFirst')"
          @sort="onSort"
          @update:date-filter="projectsStore.dropdownFilters.createdDateFilter = $event"
          @clear="clearColumnFilter('created')"
        />

        <!-- Modified date -->
        <HomeColumnHeaderFilter
          :column="{ title: t('calc.columns.modified'), key: 'lastActive' }"
          :is-active="isSorted('lastActive') || projectsStore.dropdownFilters.modifiedDateFilter.type !== null"
          :is-sorted-asc="isSortedDir('lastActive', 'asc')"
          :is-sorted-desc="isSortedDir('lastActive', 'desc')"
          filter-type="date"
          :date-filter="projectsStore.dropdownFilters.modifiedDateFilter"
          sort-asc-icon="mdi-sort-calendar-ascending"
          sort-desc-icon="mdi-sort-calendar-descending"
          :sort-asc-label="t('calc.sort.oldestFirst')"
          :sort-desc-label="t('calc.sort.newestFirst')"
          @sort="onSort"
          @update:date-filter="projectsStore.dropdownFilters.modifiedDateFilter = $event"
          @clear="clearColumnFilter('lastActive')"
        />

        <!-- Type (topFamily) -->
        <HomeColumnHeaderFilter
          :column="{ title: t('calc.columns.type'), key: 'type' }"
          :is-active="isSorted('type') || projectsStore.dropdownFilters.types.length > 0"
          :is-sorted-asc="isSortedDir('type', 'asc')"
          :is-sorted-desc="isSortedDir('type', 'desc')"
          filter-type="checkbox"
          :items="projectsStore.uniqueTypes"
          :selected-items="projectsStore.dropdownFilters.types"
          sort-asc-icon="mdi-sort-alphabetical-ascending"
          sort-desc-icon="mdi-sort-alphabetical-descending"
          :sort-asc-label="t('calc.sort.az')"
          :sort-desc-label="t('calc.sort.za')"
          @sort="onSort"
          @update:selected-items="projectsStore.dropdownFilters.types = $event || []"
          @clear="clearColumnFilter('type')"
        />

        <!-- Owner -->
        <HomeColumnHeaderFilter
          :column="{ title: t('calc.columns.owner'), key: 'owner' }"
          :is-active="isSorted('owner') || projectsStore.dropdownFilters.owners.length > 0"
          :is-sorted-asc="isSortedDir('owner', 'asc')"
          :is-sorted-desc="isSortedDir('owner', 'desc')"
          filter-type="checkbox"
          has-search
          :search-value="ownerSearch"
          :items="projectsStore.uniqueOwners"
          :selected-items="projectsStore.dropdownFilters.owners"
          sort-asc-icon="mdi-sort-alphabetical-ascending"
          sort-desc-icon="mdi-sort-alphabetical-descending"
          :sort-asc-label="t('calc.sort.az')"
          :sort-desc-label="t('calc.sort.za')"
          @sort="onSort"
          @update:search-value="ownerSearch = $event || ''"
          @update:selected-items="projectsStore.dropdownFilters.owners = $event || []"
          @clear="clearColumnFilter('owner')"
        />

        <!-- Status -->
        <HomeColumnHeaderFilter
          :column="{ title: t('calc.columns.status'), key: 'status' }"
          :is-active="isSorted('status') || projectsStore.dropdownFilters.statuses.length > 0"
          :is-sorted-asc="isSortedDir('status', 'asc')"
          :is-sorted-desc="isSortedDir('status', 'desc')"
          filter-type="checkbox"
          :items="projectsStore.uniqueStatuses"
          :selected-items="projectsStore.dropdownFilters.statuses"
          sort-asc-icon="mdi-sort-alphabetical-ascending"
          sort-desc-icon="mdi-sort-alphabetical-descending"
          :sort-asc-label="t('calc.sort.az')"
          :sort-desc-label="t('calc.sort.za')"
          @sort="onSort"
          @update:selected-items="projectsStore.dropdownFilters.statuses = $event || []"
          @clear="clearColumnFilter('status')"
        />

        <div class="th th-icon" />
        <div class="th th-icon" />
      </div>

      <!-- Empty state: no projects at all -->
      <DecisionTreeCalculatorEmptyState
        v-if="projectsStore.allActive.length === 0"
        @create="createNew"
      />

      <!-- Empty state: filter/search has no results -->
      <div v-else-if="projectsStore.paginatedProjects.length === 0" class="d-flex flex-column align-center justify-center pa-16 text-center">
        <v-avatar size="72" color="grey-ligthen-3" class="mb-5">
          <v-icon size="32" color="grey-ligthen-1">mdi-magnify</v-icon>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold mb-2">{{ t('page.noScenariosFound') }}</div>
        <div class="text-body-2 text-grey mb-5">
          {{ t('page.noResultsMatch') }}
        </div>
        <v-btn variant="outlined" size="small" @click="projectsStore.clearFilters()">
          {{ t('page.clearAllFilters') }}
        </v-btn>
      </div>

      <!-- Project rows -->
      <TransitionGroup name="row" tag="div">
        <DecisionTreeCalculatorProjectRow
          v-for="proj in projectsStore.paginatedProjects"
          :key="proj.id"
          :project="proj"
          :selected="projectsStore.selectedIds.has(proj.id)"
          @click="openProject(proj)"
          @toggle-select="projectsStore.toggleSelect(proj.id)"
          @toggle-favorite="projectsStore.toggleFavorite(proj.id)"
          @edit="openProject(proj)"
          @archive="projectsStore.archiveProject(proj.id)"
          @duplicate="projectsStore.duplicateProject(proj.id)"
          @delete="projectsStore.deleteProject(proj.id)"
        />
      </TransitionGroup>
    </v-card>

    <!-- Pagination footer -->
    <div v-if="projectsStore.visibleProjects.length > 0" class="pagination-footer">
      <div class="pagination-info">
        <span class="pagination-count">
          {{ paginationRange }} {{ t('page.of') }} {{ projectsStore.visibleProjects.length }}
          {{ projectsStore.visibleProjects.length === 1 ? t('page.project') : t('page.projects') }}
        </span>
      </div>

      <div class="pagination-controls">
        <v-btn
          icon
          variant="text"
          size="x-small"
          :disabled="projectsStore.page <= 1"
          @click="projectsStore.page--"
        >
          <v-icon size="18">mdi-chevron-left</v-icon>
        </v-btn>
        <span class="pagination-pages">
          {{ projectsStore.page }} / {{ projectsStore.totalPages }}
        </span>
        <v-btn
          icon
          variant="text"
          size="x-small"
          :disabled="projectsStore.page >= projectsStore.totalPages"
          @click="projectsStore.page++"
        >
          <v-icon size="18">mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <div class="pagination-size">
        <span class="pagination-size-label">{{ t('page.perPage') }}</span>
        <v-btn-toggle
          :model-value="projectsStore.pageSize"
          mandatory
          density="compact"
          variant="outlined"
          divided
          class="page-size-toggle"
          @update:model-value="projectsStore.pageSize = $event; projectsStore.page = 1"
        >
          <v-btn :value="20" size="x-small">20</v-btn>
          <v-btn :value="50" size="x-small">50</v-btn>
          <v-btn :value="100" size="x-small">100</v-btn>
          <v-btn :value="0" size="x-small">{{ t('page.all') }}</v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <!-- Base Table (admin only, bottom of page) -->
    <div v-if="isAdmin" class="base-table-row">
      <v-btn
        variant="text"
        color="grey"
        size="x-small"
        prepend-icon="mdi-tune-vertical"
        class="base-table-btn"
        @click="calcStore.showParams = true"
      >
        {{ t('page.baseTable') }}
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '~/stores/decisionTree/projects'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import useTranslations from '~/composables/useTranslations'

definePageMeta({ middleware: ['user-role'] })

const { t } = useTranslations('decisiontree')
const router = useRouter()
const projectsStore = useProjectsStore()
const calcStore = useCalculatorStore()
const { isAdmin } = useUser()

const showTreeV1 = ref(false)
const showTreeV2 = ref(false)
const showTreeV3 = ref(false)
const showTreeV4 = ref(false)
const showTreeV5 = ref(false)
const showHowItWorks = ref(false)

// Column search fields
const clientSearch = ref('')
const ownerSearch = ref('')

onMounted(async () => {
  await projectsStore.loadProjects()
  await calcStore.loadScoringParams()
})

// ─── Sort helpers ───
function isSorted(key: string): boolean {
  return projectsStore.sortBy.some(s => s.key === key)
}

function isSortedDir(key: string, order: 'asc' | 'desc'): boolean {
  return projectsStore.sortBy.some(s => s.key === key && s.order === order)
}

function onSort(key: string, order: 'asc' | 'desc') {
  projectsStore.toggleSort(key, order)
}

// ─── Active filters for badges ───
interface ActiveFilter {
  type: string
  label: string
  value?: string
}

const activeFilters = computed<ActiveFilter[]>(() => {
  const list: ActiveFilter[] = []
  const f = projectsStore.dropdownFilters

  f.clients.forEach(c => list.push({ type: 'clients', label: t('calc.columns.company') + ': ' + c, value: c }))
  f.owners.forEach(o => list.push({ type: 'owners', label: t('calc.columns.owner') + ': ' + o, value: o }))
  f.statuses.forEach(s => list.push({ type: 'statuses', label: t('calc.columns.status') + ': ' + s, value: s }))
  f.types.forEach(tp => list.push({ type: 'types', label: t('calc.columns.type') + ': ' + tp, value: tp }))

  if (f.createdDateFilter.type) {
    list.push({ type: 'createdDateFilter', label: t('calc.columns.created') + ': ' + f.createdDateFilter.type })
  }
  if (f.modifiedDateFilter.type) {
    list.push({ type: 'modifiedDateFilter', label: t('calc.columns.modified') + ': ' + f.modifiedDateFilter.type })
  }

  projectsStore.sortBy.forEach(s => {
    const dir = s.order === 'asc' ? 'ascending' : 'descending'
    list.push({ type: 'sort', label: 'Sort: ' + s.key + ' ' + dir, value: s.key })
  })

  return list
})

function removeFilter(af: ActiveFilter) {
  const f = projectsStore.dropdownFilters
  switch (af.type) {
    case 'clients':
      f.clients = f.clients.filter(c => c !== af.value)
      break
    case 'owners':
      f.owners = f.owners.filter(o => o !== af.value)
      break
    case 'statuses':
      f.statuses = f.statuses.filter(s => s !== af.value)
      break
    case 'types':
      f.types = f.types.filter(t => t !== af.value)
      break
    case 'createdDateFilter':
      f.createdDateFilter = { type: null, date: null, startDate: null, endDate: null }
      break
    case 'modifiedDateFilter':
      f.modifiedDateFilter = { type: null, date: null, startDate: null, endDate: null }
      break
    case 'sort':
      projectsStore.sortBy = projectsStore.sortBy.filter(s => s.key !== af.value)
      break
  }
}

function clearColumnFilter(key: string) {
  const f = projectsStore.dropdownFilters
  switch (key) {
    case 'name':
      projectsStore.sortBy = projectsStore.sortBy.filter(s => s.key !== 'name')
      break
    case 'client':
      f.clients = []
      clientSearch.value = ''
      projectsStore.sortBy = projectsStore.sortBy.filter(s => s.key !== 'client')
      break
    case 'created':
      f.createdDateFilter = { type: null, date: null, startDate: null, endDate: null }
      projectsStore.sortBy = projectsStore.sortBy.filter(s => s.key !== 'created')
      break
    case 'lastActive':
      f.modifiedDateFilter = { type: null, date: null, startDate: null, endDate: null }
      projectsStore.sortBy = projectsStore.sortBy.filter(s => s.key !== 'lastActive')
      break
    case 'type':
      f.types = []
      projectsStore.sortBy = projectsStore.sortBy.filter(s => s.key !== 'type')
      break
    case 'owner':
      f.owners = []
      ownerSearch.value = ''
      projectsStore.sortBy = projectsStore.sortBy.filter(s => s.key !== 'owner')
      break
    case 'status':
      f.statuses = []
      projectsStore.sortBy = projectsStore.sortBy.filter(s => s.key !== 'status')
      break
  }
}

// ─── Pagination range label ───
const paginationRange = computed(() => {
  const ps = projectsStore.pageSize
  const total = projectsStore.visibleProjects.length
  if (!ps) return `1–${total}` // All
  const start = (projectsStore.page - 1) * ps + 1
  const end = Math.min(projectsStore.page * ps, total)
  return `${start}–${end}`
})

// ─── Bulk delete ───
async function confirmBulkDelete() {
  const count = projectsStore.selectedIds.size
  if (!count) return
  // Simple confirm
  if (confirm(t('page.confirmBulkDelete', { count }))) {
    await projectsStore.bulkDelete()
  }
}

// ─── Actions ───
function createNew() {
  calcStore.resetEditor()
  router.push('/decisionTree/calculator/new')
}

function createNewGuided() {
  calcStore.resetEditor()
  calcStore.mode = 'guided'
  router.push('/decisionTree/calculator/new')
}

function createNewBlue() {
  calcStore.resetEditor()
  calcStore.mode = 'blue'
  router.push('/decisionTree/calculator/new')
}

function openProject(proj: any) {
  calcStore.hydrateFromState(proj.state)
  if (proj.owner) {
    projectsStore.userName = proj.owner
  }
  router.push(`/decisionTree/calculator/${proj.id}`)
}

</script>

<style scoped>
.list-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 32px 64px;
}

.table-header {
  display: grid;
  grid-template-columns: 48px 2fr 1fr 1fr 1fr 1fr 1fr 140px 40px 44px;
  padding: 0 20px;
  height: 48px;
  align-items: center;
  border-bottom: 1px solid #E9EAEC;
  background: #FFFFFF;
}

.th {
  font-size: 13px;
  font-weight: 400;
  color: #1D1D1B;
  text-transform: none;
  letter-spacing: 0;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.th-check,
.th-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Align header filter button text flush with row cell text below */
.table-header :deep(.header-btn) {
  left: 0 !important;
  padding: 4px 6px 4px 0 !important;
  margin: 0 !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  height: auto !important;
  min-height: 0 !important;
  justify-content: flex-start !important;
}

.table-header :deep(.header-btn .v-btn__content) {
  gap: 6px;
  justify-content: flex-start !important;
}

/* ─── Active filter badges ─── */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: #F3F4F6;
  font-size: 12px;
  font-weight: 500;
  color: #1D1D1B;
  cursor: pointer;
  transition: background-color 0.15s;
}

.filter-badge:hover {
  background: #E5E7EB;
}

.filter-badge svg {
  color: #9CA3AF;
  flex-shrink: 0;
}

.clear-all-btn {
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
}

.clear-all-btn:hover {
  color: #1D1D1B;
}

/* ─── Row transition group ─── */
.row-enter-active,
.row-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.row-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.row-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.row-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Base Table button (bottom of page) ── */
.base-table-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-right: 4px;
}

.base-table-btn {
  opacity: 0.5;
  text-transform: none !important;
  font-size: 11px !important;
  letter-spacing: 0 !important;
}

.base-table-btn:hover {
  opacity: 1;
}

/* ── Guided button ── */
.guided-btn {
  color: #065F46 !important;
}

/* ── Blue button ── */
.blue-btn {
  color: #1E3A5F !important;
}

/* ── How does it work button ── */
.how-btn {
  text-transform: none;
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0;
}

/* ─── Bulk action bar ─── */
.bulk-bar {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  align-items: center;
  padding: 0 20px;
  height: 48px;
  background: #F9FAFB;
  border-bottom: 1px solid #E9EAEC;
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bulk-count {
  font-size: 13px;
  font-weight: 600;
  color: #1D1D1B;
}

.bulk-delete-btn {
  text-transform: none;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0;
  border-radius: 8px;
}

/* ─── Pagination footer ─── */
.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #E9EAEC;
}

.pagination-count {
  font-size: 13px;
  color: #6B7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-pages {
  font-size: 13px;
  font-weight: 500;
  color: #1D1D1B;
  min-width: 48px;
  text-align: center;
}

.pagination-size {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-size-label {
  font-size: 12px;
  color: #9CA3AF;
  white-space: nowrap;
}

.page-size-toggle {
  height: 28px !important;
}

.page-size-toggle .v-btn {
  text-transform: none !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  letter-spacing: 0 !important;
  min-width: 36px !important;
  height: 28px !important;
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .table-header {
    grid-template-columns: 40px 2fr 1fr 1fr 1fr 1fr 1fr 100px 36px 40px;
  }
}

@media (max-width: 900px) {
  .list-page {
    padding: 16px 12px 48px;
  }
  .table-header {
    display: none;
  }
  .pagination-footer {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
}

@media (max-width: 600px) {
  .list-page {
    padding: 10px 6px 40px;
  }
}
</style>
