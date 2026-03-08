<template>
  <v-container fluid class="list-page">
    <!-- Header -->
    <v-row align="center" class="mb-2">
      <v-col cols="auto" class="d-flex align-center ga-3">
        <h1 class="text-h5 font-weight-bold">Scenarios:</h1>
        <v-chip size="small" color="primary" variant="flat" label>
          {{ projectsStore.allActive.length }}
        </v-chip>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="d-flex align-center ga-3">
        <v-text-field
          v-model="projectsStore.search"
          placeholder="Search"
          density="compact"
          variant="outlined"
          hide-details
          prepend-inner-icon="mdi-magnify"
          :clearable="!!projectsStore.search"
          style="min-width: 300px"
        />
      </v-col>
    </v-row>

    <!-- Toolbar -->
    <v-row align="center" class="mb-6">
      <v-col cols="auto" class="d-flex align-center ga-2">
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-file-tree"
          @click="showTreeV1 = true"
        >
          Decision Tree 1
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-waterfall"
          @click="showTreeV2 = true"
        >
          Decision Tree 2
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-table-check"
          @click="showTreeV3 = true"
        >
          Decision Tree 3
        </v-btn>
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-tune-variant"
          @click="showTreeV4 = true"
        >
          Quick Selector
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
          New Scenario
        </v-btn>
        <v-btn
          color="#34D399"
          variant="flat"
          prepend-icon="mdi-plus"
          class="guided-btn"
          @click="createNewGuided"
        >
          New Scenario
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
        Clear all
      </button>
    </div>

    <!-- Base Table (admin only, bottom-right) -->
    <v-btn
      v-if="isAdmin"
      class="base-table-fab"
      variant="outlined"
      color="grey-darken-1"
      size="small"
      prepend-icon="mdi-tune-vertical"
      @click="calcStore.showParams = true"
    >
      Base Table
    </v-btn>

    <DecisionTreeCalculatorParamsModal v-if="calcStore.showParams" />
    <DecisionTreeCalculatorDecisionTreeV1 v-model="showTreeV1" />
    <DecisionTreeCalculatorDecisionTreeV2 v-model="showTreeV2" />
    <DecisionTreeCalculatorDecisionTreeV3 v-model="showTreeV3" />
    <DecisionTreeCalculatorDecisionTreeV4 v-model="showTreeV4" />

    <!-- Table -->
    <v-card variant="outlined">
      <!-- Column headers -->
      <div class="table-header">
        <div class="th th-check" />

        <!-- Name — sort only -->
        <HomeColumnHeaderFilter
          :column="{ title: 'Name', key: 'name' }"
          :is-active="isSorted('name')"
          :is-sorted-asc="isSortedDir('name', 'asc')"
          :is-sorted-desc="isSortedDir('name', 'desc')"
          filter-type="checkbox"
          :items="[]"
          sort-asc-icon="mdi-sort-alphabetical-ascending"
          sort-desc-icon="mdi-sort-alphabetical-descending"
          sort-asc-label="A → Z"
          sort-desc-label="Z → A"
          @sort="onSort"
          @clear="clearColumnFilter('name')"
        />

        <!-- Client -->
        <HomeColumnHeaderFilter
          :column="{ title: 'Company', key: 'client' }"
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
          sort-asc-label="A → Z"
          sort-desc-label="Z → A"
          @sort="onSort"
          @update:search-value="clientSearch = $event || ''"
          @update:selected-items="projectsStore.dropdownFilters.clients = $event || []"
          @clear="clearColumnFilter('client')"
        />

        <!-- Created date -->
        <HomeColumnHeaderFilter
          :column="{ title: 'Created', key: 'created' }"
          :is-active="isSorted('created') || projectsStore.dropdownFilters.createdDateFilter.type !== null"
          :is-sorted-asc="isSortedDir('created', 'asc')"
          :is-sorted-desc="isSortedDir('created', 'desc')"
          filter-type="date"
          :date-filter="projectsStore.dropdownFilters.createdDateFilter"
          sort-asc-icon="mdi-sort-calendar-ascending"
          sort-desc-icon="mdi-sort-calendar-descending"
          sort-asc-label="Oldest first"
          sort-desc-label="Newest first"
          @sort="onSort"
          @update:date-filter="projectsStore.dropdownFilters.createdDateFilter = $event"
          @clear="clearColumnFilter('created')"
        />

        <!-- Modified date -->
        <HomeColumnHeaderFilter
          :column="{ title: 'Modified', key: 'lastActive' }"
          :is-active="isSorted('lastActive') || projectsStore.dropdownFilters.modifiedDateFilter.type !== null"
          :is-sorted-asc="isSortedDir('lastActive', 'asc')"
          :is-sorted-desc="isSortedDir('lastActive', 'desc')"
          filter-type="date"
          :date-filter="projectsStore.dropdownFilters.modifiedDateFilter"
          sort-asc-icon="mdi-sort-calendar-ascending"
          sort-desc-icon="mdi-sort-calendar-descending"
          sort-asc-label="Oldest first"
          sort-desc-label="Newest first"
          @sort="onSort"
          @update:date-filter="projectsStore.dropdownFilters.modifiedDateFilter = $event"
          @clear="clearColumnFilter('lastActive')"
        />

        <!-- Type (topFamily) -->
        <HomeColumnHeaderFilter
          :column="{ title: 'Type', key: 'type' }"
          :is-active="isSorted('type') || projectsStore.dropdownFilters.types.length > 0"
          :is-sorted-asc="isSortedDir('type', 'asc')"
          :is-sorted-desc="isSortedDir('type', 'desc')"
          filter-type="checkbox"
          :items="projectsStore.uniqueTypes"
          :selected-items="projectsStore.dropdownFilters.types"
          sort-asc-icon="mdi-sort-alphabetical-ascending"
          sort-desc-icon="mdi-sort-alphabetical-descending"
          sort-asc-label="A → Z"
          sort-desc-label="Z → A"
          @sort="onSort"
          @update:selected-items="projectsStore.dropdownFilters.types = $event || []"
          @clear="clearColumnFilter('type')"
        />

        <!-- Owner -->
        <HomeColumnHeaderFilter
          :column="{ title: 'Owner', key: 'owner' }"
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
          sort-asc-label="A → Z"
          sort-desc-label="Z → A"
          @sort="onSort"
          @update:search-value="ownerSearch = $event || ''"
          @update:selected-items="projectsStore.dropdownFilters.owners = $event || []"
          @clear="clearColumnFilter('owner')"
        />

        <!-- Status -->
        <HomeColumnHeaderFilter
          :column="{ title: 'Status', key: 'status' }"
          :is-active="isSorted('status') || projectsStore.dropdownFilters.statuses.length > 0"
          :is-sorted-asc="isSortedDir('status', 'asc')"
          :is-sorted-desc="isSortedDir('status', 'desc')"
          filter-type="checkbox"
          :items="projectsStore.uniqueStatuses"
          :selected-items="projectsStore.dropdownFilters.statuses"
          sort-asc-icon="mdi-sort-alphabetical-ascending"
          sort-desc-icon="mdi-sort-alphabetical-descending"
          sort-asc-label="A → Z"
          sort-desc-label="Z → A"
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
      <div v-else-if="projectsStore.visibleProjects.length === 0" class="d-flex flex-column align-center justify-center pa-16 text-center">
        <v-avatar size="72" color="grey-ligthen-3" class="mb-5">
          <v-icon size="32" color="grey-ligthen-1">mdi-magnify</v-icon>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold mb-2">No scenarios found</div>
        <div class="text-body-2 text-grey mb-5">
          No results match your current filters
        </div>
        <v-btn variant="outlined" size="small" @click="projectsStore.clearFilters()">
          Clear all filters
        </v-btn>
      </div>

      <!-- Project rows -->
      <TransitionGroup name="row" tag="div">
        <DecisionTreeCalculatorProjectRow
          v-for="proj in projectsStore.visibleProjects"
          :key="proj.id"
          :project="proj"
          @click="openProject(proj)"
          @toggle-favorite="projectsStore.toggleFavorite(proj.id)"
          @edit="openProject(proj)"
          @archive="projectsStore.archiveProject(proj.id)"
          @duplicate="projectsStore.duplicateProject(proj.id)"
          @delete="projectsStore.deleteProject(proj.id)"
        />
      </TransitionGroup>
    </v-card>

    <!-- Table footer -->
    <div v-if="projectsStore.visibleProjects.length > 0" class="pa-3">
      <span class="text-caption text-grey">
        {{ projectsStore.visibleProjects.length }}
        {{ projectsStore.visibleProjects.length === 1 ? 'project' : 'projects' }}
      </span>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '~/stores/decisionTree/projects'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'

definePageMeta({ middleware: ['user-role'] })

const router = useRouter()
const projectsStore = useProjectsStore()
const calcStore = useCalculatorStore()
const { isAdmin } = useUser()

const showTreeV1 = ref(false)
const showTreeV2 = ref(false)
const showTreeV3 = ref(false)
const showTreeV4 = ref(false)

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

  f.clients.forEach(c => list.push({ type: 'clients', label: `Company: ${c}`, value: c }))
  f.owners.forEach(o => list.push({ type: 'owners', label: `Owner: ${o}`, value: o }))
  f.statuses.forEach(s => list.push({ type: 'statuses', label: `Status: ${s}`, value: s }))
  f.types.forEach(t => list.push({ type: 'types', label: `Type: ${t}`, value: t }))

  if (f.createdDateFilter.type) {
    list.push({ type: 'createdDateFilter', label: `Created: ${f.createdDateFilter.type}` })
  }
  if (f.modifiedDateFilter.type) {
    list.push({ type: 'modifiedDateFilter', label: `Modified: ${f.modifiedDateFilter.type}` })
  }

  projectsStore.sortBy.forEach(s => {
    const dir = s.order === 'asc' ? 'ascending' : 'descending'
    list.push({ type: 'sort', label: `Sort: ${s.key} ${dir}`, value: s.key })
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

// ─── Actions ───
async function createNew() {
  const id = await projectsStore.createProject()
  if (!id) return
  calcStore.resetEditor()
  router.push(`/decisionTree/calculator/${id}`)
}

async function createNewGuided() {
  const id = await projectsStore.createProject()
  if (!id) return
  calcStore.resetEditor()
  calcStore.mode = 'guided'
  router.push(`/decisionTree/calculator/${id}`)
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
  /* empty columns */
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

.base-table-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10;
}

/* ── Guided button ── */
.guided-btn {
  color: #065F46 !important;
}
</style>
