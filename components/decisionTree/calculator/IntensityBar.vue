<template>
  <div class="intensity-row">
    <span class="intensity-label">{{ label }}:</span>
    <div class="intensity-bars">
      <div
        v-for="i in totalBars"
        :key="i"
        class="intensity-bar"
        :class="{ filled: i <= filledBars }"
        :style="i <= filledBars ? { background: barColor } : {}"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  value?: number
  family?: string
  label?: string
}>(), {
  value: -1,
  family: '',
  label: 'Intensity',
})

const totalBars = 16

const FAMILY_INTENSITY: Record<string, number> = {
  'Double Scenario': 15,
  'English': 12,
  'Dutch': 8,
  'Japanese': 8,
  'Sealed Bid': 4,
  'Traditional': 2,
}

const FAMILY_COLOR: Record<string, string> = {
  'Double Scenario': '#F472B6',
  'English': '#34D399',
  'Dutch': '#A78BFA',
  'Japanese': '#FBBF24',
  'Sealed Bid': '#67E8F9',
  'Traditional': '#FB923C',
}

const filledBars = computed(() => {
  if (props.family && FAMILY_INTENSITY[props.family] !== undefined) {
    return FAMILY_INTENSITY[props.family]
  }
  if (props.value >= 0) {
    return Math.round(props.value / 100 * totalBars)
  }
  return 0
})

const barColor = computed(() => {
  if (props.family && FAMILY_COLOR[props.family]) {
    return FAMILY_COLOR[props.family]
  }
  return '#FB923C'
})
</script>

<style scoped>
.intensity-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.intensity-label {
  font-size: 11px;
  color: #61615F;
  min-width: 68px;
  flex-shrink: 0;
  font-weight: 500;
}

.intensity-bars {
  display: flex;
  gap: 2px;
  align-items: center;
}

.intensity-bar {
  width: 6px;
  height: 11px;
  border-radius: 4px;
  background: #E9EAEC;
}

.intensity-bar.filled {
  background: #FB923C;
}
</style>
