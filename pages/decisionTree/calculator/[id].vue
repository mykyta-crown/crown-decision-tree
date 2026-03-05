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
ror field-error--right">
                        Please add your name
                      </span>
                    </Transition>
                  </div>
                </div>
              </template>

              <svg class="done-check" width="24" height="24" viewBox="0 0 20 20" fill="none">
                <path d="M5.833 10L9.958 14.125L18.797 5.286" :stroke="doneColor(1)" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M1.709 10.043L5.834 14.168M10.253 9.748L14.673 5.329" :stroke="doneColor(1)" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <Transition name="phase-slide">
            <div v-if="store.phase === 2" class="accordion-body">
              <div class="accordion-body-inner">
                <DecisionTreeCalculatorPhaseTwo />
              </div>
            </div>
          </Transition>
        </div>

        <!-- Phase 3 -->
        <div
          class="accordion-panel"
          :class="{ 'accordion-panel--open': store.phase === 3 }"
        >
          <div class="accordion-header" @click="togglePhase(3)">
            <div class="acc-left">
              <div class="acc-step" :class="{
                'acc-step--active': store.phase === 3 || steps[2].pct === 100,
                'acc-step--idle': store.phase !== 3 && steps[2].pct < 100
              }">
                <span>{{ steps[2].n }}</span>
              </div>
              <div class="acc-title">{{ steps[2].title }}</div>
            </div>
            <svg class="done-check" width="24" height="24" viewBox="0 0 20 20" fill="none">
              <path d="M5.833 10L9.958 14.125L18.797 5.286" :stroke="doneColor(2)" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M1.709 10.043L5.834 14.168M10.253 9.748L14.673 5.329" :stroke="doneColor(2)" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <Transition name="phase-slide">
            <div v-if="store.phase === 3" class="accordion-body">
              <div class="accordion-body-inner">
                <DecisionTreeCalculatorPhaseThree />
              </div>
            </div>
          </Transition>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   Page layout
   ═══════════════════════════════════════════ */
.editor-page {
  min-height: 100vh;
  background: #F9F9F9;
}

.editor-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 32px 64px;
}

/* ═══════════════════════════════════════════
   Top bar
   ═══════════════════════════════════════════ */
.editor-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0 24px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.breadcrumb-link {
  color: #61615F;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease;
}

.breadcrumb-link:hover {
  color: #1D1D1B;
}

.breadcrumb-sep {
  flex-shrink: 0;
}

.breadcrumb-current {
  color: #1D1D1B;
  font-weight: 500;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* Save status */
.save-status {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  letter-spacing: 0.01em;
}

.save-status.saving {
  color: #8E8E8E;
}

.save-status.saved {
  color: #2DD4A0;
  background: rgba(45, 212, 160, 0.06);
}

.save-status.error {
  color: #EF4444;
  background: rgba(239, 68, 68, 0.06);
}

.spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid #C0C0C0;
  border-top-color: transparent;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

/* Parameters button */
.params-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  background: #FFFFFF;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #6B6B6B;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
}

.params-btn svg {
  color: #8E8E8E;
  transition: color 0.2s ease;
}

.params-btn:hover {
  border-color: #D0D0D0;
  background: #F8F8F8;
  color: #1D1D1B;
}

.params-btn:hover svg {
  color: #1D1D1B;
}

.params-btn:active {
  transform: scale(0.98);
}

/* ═══════════════════════════════════════════
   Accordion stack (matches Crown v-expansion-panels flat)
   ═══════════════════════════════════════════ */
.accordion-stack {
  display: flex;
  flex-direction: column;
}

/* ═══════════════════════════════════════════
   Accordion panel (transparent bg, bottom border when collapsed)
   ═══════════════════════════════════════════ */
.accordion-panel {
  border-bottom: 1px solid #E9EAEC;
  transition: border-color 0.2s ease;
}

.accordion-panel--open {
  border-bottom-color: transparent;
}

.accordion-panel:last-child:not(.accordion-panel--open) {
  border-bottom: none;
}

/* ═══════════════════════════════════════════
   Accordion header
   ═══════════════════════════════════════════ */
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 8px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

/* Left side: step badge + title */
.acc-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

/* Step box — matches Crown StepTitle: 26x24px, rounded-lg */
.acc-step {
  width: 26px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

/* Idle: transparent bg, 1px solid primary border, primary text */
.acc-step--idle {
  background: transparent;
  border: 1px solid #1D1D1B;
  color: #1D1D1B;
}

/* Active (selected or complete): solid primary bg, white text */
.acc-step--active {
  background: #1D1D1B;
  border: 1px solid #1D1D1B;
  color: #FFFFFF;
}

.acc-title {
  font-size: 16px;
  font-weight: 600;
  color: #1D1D1B;
  line-height: 1.4;
}

/* Right side */
.acc-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

/* Double checkmark icon */
.done-check {
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════
   Accordion body — white card with panel-border (matches Crown)
   ═══════════════════════════════════════════ */
.accordion-body {
  padding: 0 0 8px;
}

.accordion-body-inner {
  background: #FFFFFF;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
}

/* Phase slide transition */
.phase-slide-enter-active {
  animation: fadeSlideDown 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.phase-slide-leave-active {
  animation: fadeSlideDown 0.2s cubic-bezier(0.22, 1, 0.36, 1) reverse forwards;
}

@keyframes fadeSlideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ═══════════════════════════════════════════
   Phase 2 inline fields (evName + userName)
   ═══════════════════════════════════════════ */
.inline-fields {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field-group {
  position: relative;
}

.pill-input {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  padding: 9px 16px;
  background: #FFFFFF;
  min-width: 170px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.pill-input-icon {
  color: #B0B0B0;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.pill-input:focus-within {
  border-color: #35DE9E;
  box-shadow: 0 0 0 3px rgba(53, 222, 158, 0.1);
}

.pill-input:focus-within .pill-input-icon {
  color: #35DE9E;
}

.pill-input--filled {
  border-color: #D0E8DC;
  background: #FDFFFE;
}

.pill-input--filled .pill-input-icon {
  color: #2DD4A0;
}

.pill-input--error {
  border-color: #EF4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.pill-input--error .pill-input-icon {
  color: #EF4444;
}

.pill-input-field {
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 400;
  font-family: inherit;
  flex: 1;
  background: transparent;
  min-width: 0;
  color: #1D1D1B;
}

.pill-input-field::placeholder {
  color: #C0C0C0;
  font-weight: 400;
}

/* Field errors */
.field-error {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  font-size: 11px;
  color: #EF4444;
  font-weight: 500;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.field-error--right {
  left: auto;
  right: 0;
}

/* Error pop transition */
.error-pop-enter-active {
  animation: errorAppear 0.25s ease forwards;
}

.error-pop-leave-active {
  animation: errorAppear 0.15s ease reverse forwards;
}

@keyframes errorAppear {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
}

/* ═══════════════════════════════════════════
   Responsive
   ═══════════════════════════════════════════ */
@media (max-width: 900px) {
  .editor-content {
    padding: 20px 16px 48px;
  }

  .inline-fields {
    flex-direction: column;
    gap: 8px;
  }

  .pill-input {
    min-width: 140px;
  }
}
</style>
