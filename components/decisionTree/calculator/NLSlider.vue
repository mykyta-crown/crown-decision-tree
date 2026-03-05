<template>
  <div class="nl-slider">
    <div class="track">
      <div class="track-fill" :style="{ width: pct + '%' }" />
    </div>
    <input
      type="range"
      class="range-input"
      :min="0"
      :max="1000"
      :step="1"
      :value="Math.round(pct * 10)"
      @input="onSlide"
    />
    <div
      class="thumb"
      :style="{ left: 'calc(' + pct + '% - 7px)' }"
    />
    <div class="ticks">
      <span
        v-for="t in ticks"
        :key="t.p"
        class="tick-label"
        :style="{ left: t.p + '%' }"
      >
        {{ t.l }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

interface Breakpoint {
  p: number
  v: number
}

const bp: Breakpoint[] = [
  { p: 0, v: 0 },
  { p: 5, v: 100000 },
  { p: 25, v: 2000000 },
  { p: 50, v: 5000000 },
  { p: 75, v: 7000000 },
  { p: 100, v: 10000000 },
]

const ticks = [
  { p: 0, l: '0' },
  { p: 5, l: '100K' },
  { p: 25, l: '2M' },
  { p: 50, l: '5M' },
  { p: 75, l: '7M' },
  { p: 100, l: '10M+' },
]

function v2p(v: number): number {
  if (v <= 0) return 0
  if (v >= 1e7) return 100
  for (let i = 1; i < bp.length; i++) {
    if (v <= bp[i].v) {
      const a = bp[i - 1]
      return a.p + ((v - a.v) / (bp[i].v - a.v)) * (bp[i].p - a.p)
    }
  }
  return 100
}

function p2v(p: number): number {
  if (p <= 0) return 0
  if (p >= 100) return 1e7
  // Snap to breakpoints if close (within 1.5% of slider)
  for (const b of bp) {
    if (Math.abs(p - b.p) < 1.5) return b.v
  }
  for (let i = 1; i < bp.length; i++) {
    if (p <= bp[i].p) {
      const a = bp[i - 1]
      const raw = a.v + ((p - a.p) / (bp[i].p - a.p)) * (bp[i].v - a.v)
      // Smart rounding based on magnitude
      if (raw < 200000) return Math.round(raw / 10000) * 10000
      if (raw < 1000000) return Math.round(raw / 50000) * 50000
      return Math.round(raw / 100000) * 100000
    }
  }
  return 1e7
}

const pct = computed(() => v2p(props.modelValue))

function onSlide(e: Event) {
  const val = Number((e.target as HTMLInputElement).value) / 10
  emit('update:modelValue', p2v(val))
}
</script>

<style scoped>
.nl-slider {
  position: relative;
  padding: 0 2px;
  margin-bottom: 4px;
}

.track {
  height: 8px;
  border-radius: 4px;
  background: #E9EAEC;
  position: relative;
}

.track-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #2DD4A0, #10B981);
  transition: width 0.05s linear;
}

.range-input {
  position: absolute;
  top: -6px;
  left: 0;
  width: 100%;
  height: 20px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  margin: 0;
}

.thumb {
  position: absolute;
  top: -3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2DD4A0;
  border: 2px solid #fff;
  pointer-events: none;
  transition: left 0.05s linear;
}

.ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  position: relative;
  height: 14px;
}

.tick-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 11px;
  color: #8E8E8E;
  font-weight: 500;
  white-space: nowrap;
}
</style>
