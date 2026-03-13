<script setup lang="ts">
import { computed } from 'vue'
import { useCalculatorStore } from '~/stores/architect/calculator'
import { useProjectsStore } from '~/stores/architect/projects'
import { FC, gfc, noFC } from '~/utils/architect/constants'
import useTranslations from '~/composables/useTranslations'
const { t } = useTranslations('architect')

const store = useCalculatorStore()
const projectsStore = useProjectsStore()

const engC = FC['English']
const dutC = FC['Dutch']

interface LotCard {
  lotId: number
  index: number
  family: string | null
  displayName: string
  ok: boolean
  isDouble: boolean
  subtitle: string
  bg: string
  borderCol: string
  borderImage: string | null
  outlineCol: string
  titleCol: string
}

function strategyDisplayName(rec: { family: string; tf: string; aw: string } | null): string {
  if (!rec) return t('calc.rec.noSuggestion')
  const familyNames: Record<string, string> = {
    English: t('families.english'),
    Dutch: t('families.dutch'),
    'Sealed Bid': t('families.sealedBid'),
    Japanese: t('families.japanese'),
    'Double Scenario': t('families.doubleScenario'),
    Traditional: t('families.traditional'),
  }
  const base = familyNames[rec.family] || rec.family
  if (rec.family === 'Traditional' || rec.family === 'Double Scenario') return base

  const tfLabels: Record<string, string> = {
    'Fixed+Dynamic': t('calc.rec.transfo'),
    Ceiling: t('calc.rec.ceiling'),
    Preference: t('calc.rec.preferred'),
    'Ceiling+Pref': t('calc.rec.ceilingPreferred'),
  }

  const parts = [base]
  if (rec.tf && rec.tf !== 'None' && rec.tf !== '—') {
    parts.push(tfLabels[rec.tf] || rec.tf)
  }
  if (rec.aw && rec.aw !== '—') {
    parts.push(rec.aw)
  }
  return parts.join(' - ')
}

const lotCards = computed<LotCard[]>(() => {
  return store.lots.map((lot, li) => {
    const top = store.lotTop3[li] || []
    const ti = top[0]
    const f = ti ? ti.family : null
    const c = f ? gfc(f) : noFC
    const ok = store.lotSc[li] !== null
    const oc = Math.max(0, top.length - 1)
    const isDouble = f === 'Double Scenario'

    // In guided/blue mode, warn if filled prices < nSup
    const filledCount = lot.prices.filter((p, i) => p > 0 && !lot.excl[i]).length
    const supMismatch = (store.mode === 'guided' || store.mode === 'blue') && ok && filledCount < store.nSup

    const subtitle = !ok
      ? t('calc.rec.completeInputs')
      : supMismatch
        ? t('calc.rec.suppliersFilled', { filled: filledCount, total: store.nSup })
        : isDouble
          ? t('calc.rec.englishAndDutch')
          : oc > 0
            ? t('calc.rec.otherOptions', { count: oc })
            : t('calc.rec.bestMatch')

    const bg = ok
      ? isDouble
        ? `linear-gradient(135deg, ${engC.bg} 0%, ${dutC.bg} 100%)`
        : c.bg
      : store.selLot === li
        ? '#F5F5F5'
        : '#F8F8F8'

    const borderCol = ok
      ? isDouble
        ? 'transparent'
        : c.border
      : '#E9EAEC'

    const outlineCol = ok
      ? isDouble
        ? dutC.border
        : c.border
      : '#D0D0D0'

    const titleCol = ok
      ? isDouble
        ? '#1D1D1B'
        : c.text
      : '#6B6B6B'

    const borderImage = ok && isDouble
      ? `linear-gradient(180deg, ${engC.border} 0%, ${dutC.border} 100%) 1`
      : null

    return {
      lotId: lot.id,
      index: li,
      family: f,
      displayName: ok ? strategyDisplayName(ti) : t('calc.rec.noSuggestion'),
      ok,
      isDouble,
      subtitle,
      bg,
      borderCol,
      borderImage,
      outlineCol,
      titleCol,
    }
  })
})

function selectLot(li: number) {
  store.selLot = li
}

function seeDetails() {
  let hasErr = false
  if (!store.evName.trim()) {
    store.evNameErr = true
    hasErr = true
  }
  // Block if supplier offers are incomplete
  if (!store.allOffersFilled) {
    store.offersErr = true
    hasErr = true
  }
  if (hasErr) {
    store.phase = 2
    return
  }
  store.phase = 3
  store.expLot = 0
}
</script>

<template>
  <v-card variant="outlined" class="rec-panel pa-3">
    <div class="rec-header" :style="{ height: store.lotHeaderH ? (store.lotHeaderH - 17) + 'px' : 'auto' }">
      <div class="rec-title">{{ t('calc.rec.aiTitle') }}</div>
      <p class="rec-subtitle">{{ t('calc.rec.aiSubtitle') }}</p>
    </div>

    <div class="rec-cards">
      <div
        v-for="card in lotCards"
        :key="card.lotId"
        class="rec-card"
        :class="{ active: store.selLot === card.index, dimmed: store.selLot !== card.index }"
        :style="{
          background: card.bg,
          borderLeftColor: card.borderCol,
          borderImage: card.borderImage,
          outlineColor: store.selLot === card.index ? card.outlineCol : 'transparent',
        }"
        @click="selectLot(card.index)"
      >
        <div class="rec-card-title" :style="{ color: card.titleCol }">
          {{ card.displayName }}
        </div>
        <div class="rec-card-sub text-caption text-grey-darken-1">{{ card.subtitle }}</div>
      </div>
    </div>

    <v-btn
      color="primary"
      variant="flat"
      block
      class="mt-4"
      append-icon="mdi-arrow-right"
      @click="seeDetails"
    >
      {{ t('calc.rec.seeDetails') }}
    </v-btn>
  </v-card>
</template>

<style scoped>
.rec-panel {
  position: sticky;
  top: 32px;
  align-self: flex-start;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}
.rec-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.rec-cards {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;
  scrollbar-width: thin;
  scrollbar-color: #D0D0D0 transparent;
}
.rec-cards::-webkit-scrollbar {
  width: 3px;
}
.rec-cards::-webkit-scrollbar-thumb {
  background: #D0D0D0;
  border-radius: 2px;
}
.rec-card {
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #E9EAEC;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
  flex-shrink: 0;
  height: 52px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  outline: 1.5px solid transparent;
  outline-offset: -1px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
.rec-card.active {
  opacity: 1;
}
.rec-card.dimmed {
  opacity: 0.65;
}
.rec-title {
  font-size: 13px;
  font-weight: 700;
  color: #1D1D1B;
  margin-bottom: 2px;
}
.rec-subtitle {
  font-size: 12px;
  font-weight: 400;
  color: #787878;
  line-height: normal;
  margin: 0;
}
.rec-card-title {
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}
.rec-card-sub {
  font-size: 10px;
  color: #61615F;
  font-weight: 500;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .rec-panel {
    position: static;
    top: auto;
    max-height: none;
  }
  .rec-cards {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }
  .rec-card {
    flex: 1 1 calc(50% - 4px);
    min-width: 140px;
    height: auto;
    min-height: 48px;
  }
}

@media (max-width: 500px) {
  .rec-card {
    flex: 1 1 100%;
  }
}
</style>
