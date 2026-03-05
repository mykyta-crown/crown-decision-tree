<template>
  <div class="d-flex align-center ga-2">
    <span class="option-label">{{ label }}:</span>
    <div class="d-flex ga-1 flex-wrap">
      <v-chip
        v-for="opt in options"
        :key="opt"
        size="x-small"
        :variant="opt === selected ? 'outlined' : 'text'"
        :color="opt === selected ? 'primary' : undefined"
        class="font-weight-medium"
      >
        {{ opt }}
      </v-chip>
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
.option-label {
  font-size: 11px;
  color: #61615F;
  min-width: 72px;
  flex-shrink: 0;
  font-weight: 500;
}
</style>
