<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import { useProjectsStore } from '~/stores/decisionTree/projects'

const route = useRoute()
const router = useRouter()
const store = useCalculatorStore()
const projectsStore = useProjectsStore()

const activeId = computed(() => Number(route.params.id))
const saveStatus = ref<'' | 'saving' | 'saved' | 'error'>('')
let saveTimer: ReturnType<typeof setTimeout> | null = null

// ─── Steps definition ───
const steps = computed(() => [
  { n: 1, title: 'eAuction Feasibility Check', pct: store.p1Pct },
  { n: 2, title: 'Lot Configuration', pct: store.p2Pct },
  { n: 3, title: 'Recommended eAuction Types', pct: store.p3Pct },
])

// ─── Expansion panel state (maps to store.phase) ───
const activePanel = computed({
  get: () => (store.phase > 0 ? store.phase - 1 : undefined),
  set: (val: number | undefined) => {
    store.phase = val !== undefined ? val + 1 : 0
  },
})

// ─── Step validity for TermsStepTitle ───
const step1Valid = computed(() => steps.value[0].pct === 100)
const step2Valid = computed(() => steps.value[1].pct === 100)
const step3Valid = computed(() => steps.value[2].pct === 100)

// ─── Breadcrumbs ───
const breadcrumbs = computed(() => [
  { title: 'Scenarios', to: '/decisionTree' },
  { title: store.evName || 'New Scenario', disabled: true },
])

// ─── Load project on mount ───
onMounted(() => {
  projectsStore.loadFromStorage()
  const proj = projectsStore.getProject(activeId.value)
  if (proj) {
    store.hydrateFromState(proj.state)
    if (proj.owner && proj.owner !== 'You') {
      projectsStore.userName = proj.owner
    }
  }
})

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
})

// ─── Auto-save with debounce ───
function doSave() {
  if (!activeId.value) return
  const snapshot = store.getSnapshot()
  const topFamily = store.lotTop3.length > 0 && store.lotTop3[0].length > 0
    ? store.lotTop3[0][0].family
    : null
  projectsStore.saveProject(activeId.value, snapshot, {
    evName: store.evName,
    totBase: store.totBase,
    ccy: store.ccy,
    statusLabel: store.statusLabel,
    topFamily,
  })
}

watch(
  () => [
    store.phase, store.spend, store.nSup, store.award, store.ccy,
    store.evName, store.lots, store.sc, store.supNames, store.selLot, store.expLot, store.params,
  ],
  () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveStatus.value = 'saving'
    saveTimer = setTimeout(() => {
      try {
        doSave()
        saveStatus.value = 'saved'
        setTimeout(() => { saveStatus.value = '' }, 2000)
      } catch {
        saveStatus.value = 'error'
      }
    }, 800)
  },
  { deep: true },
)

// ─── Navigation ───
function goBack() {
  doSave()
  navigateTo('/decisionTree')
}

// ─── userName input ───
function onUserNameInput(val: string) {
  projectsStore.userName = val
  if (val.trim()) store.userNameErr = false
}

// ─── evName input ───
function onEvNameInput(val: string) {
  store.evName = val
  if (val.trim()) store.evNameErr = false
}
</script>

<template>
  <v-container fluid class="editor-page">
    <!-- Top bar -->
    <v-row align="center" class="mb-2">
      <v-col>
        <v-breadcrumbs :items="breadcrumbs" density="compact" class="pl-1 pb-0">
          <template #item="{ item }">
            <v-breadcrumbs-item
              :to="item.to"
              :disabled="item.disabled"
              @click="!item.disabled && goBack()"
            >
              {{ item.title }}
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>
      </v-col>
      <v-col cols="auto" class="d-flex align-center ga-3">
        <!-- Save status -->
        <Transition name="save-fade" mode="out-in">
          <span v-if="saveStatus" :key="saveStatus" class="save-indicator" :class="saveStatus">
            <template v-if="saveStatus === 'saving'">
              <v-progress-circular indeterminate size="12" width="1.5" color="grey" />
              <span class="ml-1">Saving...</span>
            </template>
            <template v-else-if="saveStatus === 'saved'">
              <v-icon size="14" color="green">mdi-check</v-icon>
              <span class="ml-1">Saved</span>
            </template>
            <template v-else-if="saveStatus === 'error'">
              <v-icon size="14" color="error">mdi-alert-circle-outline</v-icon>
              <span class="ml-1">Error</span>
            </template>
          </span>
        </Transition>

        <!-- Parameters button -->
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          size="small"
          prepend-icon="mdi-tune-vertical"
          @click="store.showParams = true"
        >
          Parameters
        </v-btn>
      </v-col>
    </v-row>

    <!-- Params modal -->
    <DecisionTreeCalculatorParamsModal v-if="store.showParams" />

    <!-- Accordion panels -->
    <v-row>
      <v-col class="px-4">
        <v-expansion-panels v-model="activePanel" flat>
          <!-- Phase 1 -->
          <v-expansion-panel bg-color="transparent" :class="activePanel !== 0 ? 'border-b-thin' : ''">
            <v-expansion-panel-title class="px-2" hide-actions>
              <TermsStepTitle v-model="step1Valid" :is-selected="activePanel === 0" :builder="true">
                <template #numero>1</template>
                <template #title>{{ steps[0].title }}</template>
              </TermsStepTitle>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-sheet class="bg-white rounded-lg" border>
                <DecisionTreeCalculatorPhaseOne />
              </v-sheet>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Phase 2 -->
          <v-expansion-panel bg-color="transparent" :class="activePanel !== 1 ? 'border-b-thin' : ''">
            <v-expansion-panel-title class="px-2" hide-actions>
              <TermsStepTitle v-model="step2Valid" :is-selected="activePanel === 1" :builder="true">
                <template #numero>2</template>
                <template #title>
                  <div class="d-flex align-center ga-4" style="width: 100%">
                    <span>{{ steps[1].title }}</span>
                    <v-spacer />
                    <!-- Inline fields when Phase 2 is active -->
                    <template v-if="activePanel === 1">
                      <div class="d-flex align-center ga-3" @click.stop>
                        <v-text-field
                          :model-value="store.evName"
                          placeholder="Event name"
                          density="compact"
                          variant="outlined"
                          hide-details
                          style="max-width: 200px"
                          :error="store.evNameErr && !store.evName.trim()"
                          @update:model-value="onEvNameInput"
                        >
                          <template #prepend-inner>
                            <v-icon size="16" color="grey">mdi-pencil-outline</v-icon>
                          </template>
                        </v-text-field>
                        <v-text-field
                          :model-value="projectsStore.userName"
                          placeholder="Your name"
                          density="compact"
                          variant="outlined"
                          hide-details
                          style="max-width: 200px"
                          :error="store.userNameErr && !projectsStore.userName.trim()"
                          @update:model-value="onUserNameInput"
                        >
                          <template #prepend-inner>
                            <v-icon size="16" color="grey">mdi-account-outline</v-icon>
                          </template>
                        </v-text-field>
                      </div>
                    </template>
                  </div>
                </template>
              </TermsStepTitle>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-sheet class="bg-white rounded-lg" border>
                <DecisionTreeCalculatorPhaseTwo />
              </v-sheet>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Phase 3 -->
          <v-expansion-panel bg-color="transparent" :class="activePanel !== 2 ? 'border-b-thin' : ''">
            <v-expansion-panel-title class="px-2" hide-actions>
              <TermsStepTitle v-model="step3Valid" :is-selected="activePanel === 2" :builder="true">
                <template #numero>3</template>
                <template #title>{{ steps[2].title }}</template>
              </TermsStepTitle>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-sheet class="bg-white rounded-lg" border>
                <DecisionTreeCalculatorPhaseThree />
              </v-sheet>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.editor-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 32px 64px;
}

/* Save status indicator */
.save-indicator {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
}

.save-indicator.saving {
  color: rgb(var(--v-theme-grey));
}

.save-indicator.saved {
  color: rgb(var(--v-theme-green-darken-1));
  background: rgba(4, 176, 100, 0.06);
}

.save-indicator.error {
  color: rgb(var(--v-theme-error));
  background: rgba(250, 31, 29, 0.06);
}

/* Save fade transition */
.save-fade-enter-active,
.save-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.save-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.save-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Override expansion panel default styles for this page */
:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 0 8px;
}

:deep(.v-expansion-panel-title) {
  min-height: 64px;
}

/* Override breadcrumbs divider padding */
:deep(.v-breadcrumbs-divider) {
  padding-inline: 4px !important;
}
</style>
