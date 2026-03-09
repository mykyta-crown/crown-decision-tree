<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import { useProjectsStore } from '~/stores/decisionTree/projects'
import useTranslations from '~/composables/useTranslations'

definePageMeta({ middleware: ['user-role'] })

const route = useRoute()
const router = useRouter()
const store = useCalculatorStore()
const projectsStore = useProjectsStore()
const { t } = useTranslations('decisiontree')

const isNew = computed(() => route.params.id === 'new')
const activeId = ref<number | null>(isNew.value ? null : Number(route.params.id))
const saveStatus = ref<'' | 'saving' | 'saved' | 'error'>('')
let saveTimer: ReturnType<typeof setTimeout> | null = null
const isMounted = ref(true)

// ─── Steps definition ───
// p2Pct from store counts evName + lot prices; we add userName as an extra requirement
const p2PctFull = computed(() => {
  let t = 2 // evName + userName
  let d = 0
  if (store.evName.trim()) d++
  if (projectsStore.userName.trim()) d++
  store.lots.forEach(l => {
    t++
    if (l.prices.some((p, i) => p > 0 && !l.excl[i])) d++
  })
  return t > 0 ? Math.round(d / t * 100) : 0
})

const steps = computed(() => [
  { n: 1, title: t('calc.steps.step1'), pct: store.p1Pct },
  { n: 2, title: t('calc.steps.step2'), pct: p2PctFull.value },
  { n: 3, title: t('calc.steps.step3'), pct: store.p3Pct },
])

// ─── Expansion panel state (maps to store.phase) ───
const shakeStep = ref<number | null>(null)

const activePanel = computed({
  get: () => (store.phase > 0 ? store.phase - 1 : undefined),
  set: (val: number | undefined) => {
    const target = val !== undefined ? val : -1
    const current = activePanel.value ?? -1

    // Closing current panel is always allowed
    if (target === current || target < 0) {
      store.phase = 0
      return
    }

    // Going to Phase 2 requires Phase 1 complete
    if (target >= 1 && !step1Valid.value) {
      flashErrors(0)
      return
    }

    // Create project in DB when first entering Phase 2
    if (target >= 1 && !activeId.value) {
      ensureProjectCreated()
    }

    // Going to Phase 3 requires Phase 2 fields complete
    if (target >= 2) {
      const p2Missing = !store.evName.trim() || !projectsStore.userName.trim() || !step2Valid.value
      if (p2Missing) {
        flashErrors(1)
        return
      }
    }

    store.phase = target + 1
  },
})

function flashErrors(step: number) {
  if (step === 0) {
    // Phase 1 errors
    if (store.spend <= 0) store.spendErr = true
    if (store.nSup <= 0) store.nSupErr = true
    if (store.mode !== 'guided' && store.award === null) store.awardErr = true
  } else if (step === 1) {
    // Phase 2 errors
    if (!store.evName.trim()) store.evNameErr = true
    if (!projectsStore.userName.trim()) store.userNameErr = true
  }
  // Trigger shake animation
  shakeStep.value = step
  setTimeout(() => { shakeStep.value = null }, 600)
}

// ─── Step validity ───
const step1Valid = computed(() => steps.value[0].pct === 100)
const step2Valid = computed(() => steps.value[1].pct === 100)
const step3Valid = computed(() => steps.value[2].pct === 100)

function stepValid(si: number): boolean {
  return [step1Valid, step2Valid, step3Valid][si]?.value ?? false
}

// ─── Breadcrumbs ───
const breadcrumbs = computed(() => [
  { title: t('calc.breadcrumb.scenarios'), to: '/decisionTree' },
  { title: store.evName || t('calc.breadcrumb.newScenario'), disabled: true },
])

// ─── Load project on mount ───
onMounted(async () => {
  if (!projectsStore.loaded) {
    await projectsStore.loadProjects()
  }
  if (!store.paramsLoaded) {
    await store.loadScoringParams()
  }
  if (activeId.value) {
    const proj = projectsStore.getProject(activeId.value)
    if (proj) {
      store.hydrateFromState(proj.state)
      if (proj.owner) {
        projectsStore.userName = proj.owner
      }
    }
  }
})

onBeforeUnmount(() => {
  isMounted.value = false
  if (saveTimer) clearTimeout(saveTimer)
  store.dispose()
})

// ─── Auto-save with debounce ───
async function doSave() {
  if (!activeId.value) return
  const snapshot = store.getSnapshot()
  const topFamily = store.lotTop3.length > 0 && store.lotTop3[0].length > 0
    ? store.lotTop3[0][0].family
    : null
  await projectsStore.saveProject(activeId.value, snapshot, {
    evName: store.evName,
    totBase: store.totBase,
    ccy: store.ccy,
    statusLabel: store.statusLabel,
    topFamily,
  })
}

// Create project in DB when transitioning from Phase 1 to Phase 2
async function ensureProjectCreated(): Promise<boolean> {
  if (activeId.value) return true
  const id = await projectsStore.createProject()
  if (!id) return false
  activeId.value = id
  // Update URL silently without triggering Vue Router re-render
  window.history.replaceState({}, '', `/decisionTree/calculator/${id}`)
  // Save the current state in background (non-blocking)
  doSave()
  return true
}

// Watch phase changes to create project when entering Phase 2+
watch(() => store.phase, async (newPhase) => {
  if (newPhase >= 2 && !activeId.value) {
    await ensureProjectCreated()
  }
})

watch(
  () => [
    store.mode, store.phase, store.spend, store.nSup, store.award, store.ccy,
    store.evName, store.lots, store.sc, store.supNames, store.selLot, store.expLot, store.params,
  ],
  () => {
    if (!activeId.value) return // not persisted yet — ensureProjectCreated handles first save
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      if (!isMounted.value) return
      saveStatus.value = 'saving'
      try {
        await doSave()
        if (!isMounted.value) return
        saveStatus.value = 'saved'
        setTimeout(() => { if (isMounted.value) saveStatus.value = '' }, 2000)
      } catch {
        if (isMounted.value) {
          saveStatus.value = 'error'
          setTimeout(() => { if (isMounted.value) saveStatus.value = '' }, 5000)
        }
      }
    }, 800)
  },
  { deep: true },
)

// ─── Navigation ───
async function goBack() {
  await doSave()
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

// ─── Enter key advances to next step ───
function tryAdvanceStep() {
  const current = activePanel.value
  if (current === undefined) return
  // Try to open the next step (activePanel setter handles validation + flashErrors)
  activePanel.value = current + 1
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
              <span class="ml-1">{{ t('calc.save.saving') }}</span>
            </template>
            <template v-else-if="saveStatus === 'saved'">
              <v-icon size="14" color="green">mdi-check</v-icon>
              <span class="ml-1">{{ t('calc.save.saved') }}</span>
            </template>
            <template v-else-if="saveStatus === 'error'">
              <v-icon size="14" color="error">mdi-alert-circle-outline</v-icon>
              <span class="ml-1">{{ t('calc.save.error') }}</span>
            </template>
          </span>
        </Transition>

      </v-col>
    </v-row>

    <!-- Accordion panels -->
    <v-row>
      <v-col class="px-4">
        <v-expansion-panels v-model="activePanel" flat>
          <v-expansion-panel
            v-for="(step, si) in steps"
            :key="si"
            bg-color="transparent"
            class="step-panel"
            :class="{
              'step-panel--active': activePanel === si,
              'step-panel--done': stepValid(si),
              'step-panel--shake': shakeStep === si,
            }"
          >
            <v-expansion-panel-title class="step-title-wrap" hide-actions>
              <div class="step-header">
                <!-- Number badge -->
                <div
                  class="step-badge"
                  :class="{
                    'step-badge--active': activePanel === si,
                    'step-badge--done': stepValid(si) && activePanel !== si,
                  }"
                >
                  <svg v-if="stepValid(si) && activePanel !== si" width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span v-else>{{ step.n }}</span>
                </div>

                <!-- Title + inline fields for Phase 2 -->
                <div class="step-info">
                  <span class="step-label">{{ step.title }}</span>
                  <!-- Inline fields when Phase 2 is active -->
                  <div v-if="si === 1 && activePanel === 1" class="step-inline-fields" @click.stop @keydown.enter.stop="tryAdvanceStep()" @keydown.space.stop @keyup.space.prevent.stop>
                    <v-text-field
                      :model-value="store.evName"
                      :label="t('calc.fields.scenarioName')"
                      :placeholder="t('calc.fields.scenarioPlaceholder')"
                      density="compact"
                      variant="outlined"
                      hide-details
                      style="min-width: 260px"
                      :error="store.evNameErr && !store.evName.trim()"
                      @update:model-value="onEvNameInput"
                    >
                      <template #prepend-inner>
                        <v-icon size="16" color="grey">mdi-pencil-outline</v-icon>
                      </template>
                    </v-text-field>
                    <v-text-field
                      :model-value="projectsStore.userName"
                      :label="t('calc.fields.yourName')"
                      :placeholder="t('calc.fields.yourNamePlaceholder')"
                      density="compact"
                      variant="outlined"
                      hide-details
                      style="min-width: 220px"
                      :error="store.userNameErr && !projectsStore.userName.trim()"
                      @update:model-value="onUserNameInput"
                    >
                      <template #prepend-inner>
                        <v-icon size="16" color="grey">mdi-account-outline</v-icon>
                      </template>
                    </v-text-field>
                  </div>
                </div>

                <!-- Progress pill -->
                <div class="step-meta">
                  <span
                    v-if="step.pct < 100"
                    class="step-pct"
                    :class="{ 'step-pct--active': activePanel === si }"
                  >
                    {{ step.pct }}%
                  </span>
                  <span v-else class="step-done-pill">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    {{ t('calc.steps.complete') }}
                  </span>
                </div>

                <!-- Chevron -->
                <div class="step-chevron" :class="{ 'step-chevron--open': activePanel === si }">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text @keydown.enter.stop="si < 2 && tryAdvanceStep()">
              <v-sheet class="bg-white rounded-lg" border>
                <template v-if="si === 0">
                  <DecisionTreeCalculatorPhaseOneGuided v-if="store.mode === 'guided'" />
                  <DecisionTreeCalculatorPhaseOne v-else />
                </template>
                <template v-else-if="si === 1">
                  <DecisionTreeCalculatorPhaseTwoGuided v-if="store.mode === 'guided'" />
                  <DecisionTreeCalculatorPhaseTwo v-else />
                </template>
                <template v-else-if="si === 2">
                  <DecisionTreeCalculatorPhaseThree />
                </template>
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

/* ── Step panels ── */
.step-panel {
  border-bottom: 1px solid #E9EAEC;
  position: relative;
}

.step-panel:last-child {
  border-bottom: none;
}

.step-panel--active {
  border-bottom-color: transparent;
}

/* Full-height accent bar via pseudo-element on the panel */
.step-panel::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: transparent;
  transition: background-color 0.3s ease;
  z-index: 1;
}

.step-panel--active::before {
  background: #1D1D1B;
}

.step-panel--done:not(.step-panel--active)::before {
  background: #34D399;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 0 8px 16px;
}

:deep(.v-expansion-panel-title) {
  min-height: 0;
  padding: 0;
}

:deep(.v-expansion-panel-title__overlay) {
  opacity: 0 !important;
}

/* ── Step header layout ── */
.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 18px 20px 18px 16px;
  position: relative;
  transition: background-color 0.2s ease;
  border-radius: 8px;
}

.step-header:hover {
  background: #FAFAFA;
}

.step-panel--active .step-header:hover {
  background: transparent;
}

/* ── Number badge ── */
.step-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.25s ease;
  background: #F3F4F6;
  color: #9CA3AF;
}

.step-badge--active {
  background: #1D1D1B;
  color: #FFF;
}

.step-badge--done {
  background: #D1FAE5;
  color: #065F46;
}

/* ── Title & inline fields ── */
.step-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.step-label {
  font-size: 16px;
  font-weight: 600;
  color: #1D1D1B;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.step-panel:not(.step-panel--active):not(.step-panel--done) .step-label {
  color: #6B7280;
}

.step-inline-fields {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

/* ── Progress pill ── */
.step-meta {
  flex-shrink: 0;
}

.step-pct {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  background: #F3F4F6;
  color: #9CA3AF;
  transition: all 0.2s ease;
}

.step-pct--active {
  background: #FEF3C7;
  color: #92400E;
}

.step-done-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  background: #D1FAE5;
  color: #065F46;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ── Chevron ── */
.step-chevron {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease, background 0.15s ease;
  flex-shrink: 0;
}

.step-chevron:hover {
  background: #F3F4F6;
}

.step-chevron--open {
  transform: rotate(180deg);
  color: #1D1D1B;
}

/* ── Shake animation for incomplete steps ── */
.step-panel--shake {
  animation: shake 0.5s ease;
}

.step-panel--shake::before {
  background: #EF4444 !important;
}

.step-panel--shake .step-badge {
  background: #FEE2E2 !important;
  color: #DC2626 !important;
}

.step-panel--shake .step-label {
  color: #DC2626 !important;
}

.step-panel--shake .step-pct {
  background: #FEE2E2 !important;
  color: #DC2626 !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(5px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(3px); }
  75% { transform: translateX(-2px); }
}

/* Override breadcrumbs divider padding */
:deep(.v-breadcrumbs-divider) {
  padding-inline: 4px !important;
}
</style>
