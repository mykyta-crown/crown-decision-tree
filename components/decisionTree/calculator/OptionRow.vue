<template>
  <div class="option-row">
    <span class="option-label">{{ label }}:</span>
    <div class="option-pills">
      <span
        v-for="opt in options"
        :key="opt"
        class="pill"
        :class="{ 'pill-selected': opt === selected }"
      >
        {{ opt }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  options: string[]
  selected: string
}>()
</script>

<style scoped>
.option-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.option-label {
  font-size: 11px;
  color: #1D1D1B;
  min-width: 68px;
  flex-shrink: 0;
  font-weight: 500;
}

.option-pills {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.pill {
  padding: 3px 8px;
  border-radius: 5px;
  border: 1.5px solid #E5E7EB;
  font-size: 10px;
  color: #9CA3AF;
  font-weight: 400;
  background: #FFF;
  line-height: 1.3;
  white-space: nowrap;
  flex-shrink: 0;
}

.pill-selected {
  border-color: #1D1D1B;
  color: #1D1D1B;
  font-weight: 600;
}
</style>
