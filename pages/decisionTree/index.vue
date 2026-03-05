<template>
  <v-container fluid class="list-page">
    <!-- Header -->
    <v-row align="center" class="mb-6">
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
          style="max-width: 260px"
        />
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="createNew"
        >
          New Scenario
        </v-btn>
      </v-col>
    </v-row>

    <!-- Toolbar -->
    <v-row class="mb-3">
      <v-spacer />
      <v-col cols="auto">
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          size="small"
          prepend-icon="mdi-tune-vertical"
          @click="calcStore.showParams = true"
        >
          Base Table
        </v-btn>
      </v-col>
    </v-row>

    <DecisionTreeCalculatorParamsModal v-if="calcStore.showParams" />

    <!-- Table -->
    <v-card variant="outlined">
      <!-- Column headers -->
      <div class="table-header">
        <div class="th th-check" />
        <div class="th th-name">Name</div>
        <div class="th">Company</div>
        <div class="th">Date</div>
        <div class="th">Type</div>
        <div class="th">Owner</div>
        <div class="th th-status">Status</div>
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
          No results for "{{ projectsStore.search }}"
        </div>
        <v-btn
          v-if="projectsStore.search"
          variant="outlined"
          size="small"
          @click="projectsStore.search = ''"
        >
          Clear search
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
import { ref, onMounted } from 'vue'
import { useProjectsStore } from '~/stores/decisionTree/projects'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'

const router = useRouter()
const projectsStore = useProjectsStore()
const calcStore = useCalculatorStore()

const searchFocused = ref(false)

onMounted(() => {
  projectsStore.loadFromStorage()
})

// ─── Actions ───
function createNew() {
  const id = projectsStore.createProject()
  calcStore.resetEditor()
  router.push(`/decisionTree/calculator/${id}`)
}

function openProject(proj: any) {
  calcStore.hydrateFromState(proj.state)
  if (proj.owner && proj.owner !== 'You') {
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
  grid-template-columns: 48px 2fr 1fr 1fr 1fr 1fr 140px 40px 44px;
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

.sort-icon {
  color: #C7C7C7;
  flex-shrink: 0;
}

.th-check,
.th-icon {
  /* empty columns */
}

.th-name {
  padding-left: 0;
}

.th-status {
  padding-left: 4px;
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
</style>
