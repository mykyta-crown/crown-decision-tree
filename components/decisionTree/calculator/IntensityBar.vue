<template>
  <div class="intensity-row">
    <span class="intensity-label">Intensity:</span>
    <div class="intensity-bars">
      <div
        v-for="i in totalBars"
        :key="i"
        class="intensity-bar"
        :class="{ filled: i <= filledBars }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
}>()

const totalBars = 16

const filledBars = computed(() => Math.round(props.value / 100 * totalBars))
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
  min-width: 72px;
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
