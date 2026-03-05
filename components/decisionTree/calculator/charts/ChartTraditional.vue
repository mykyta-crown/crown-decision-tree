<template>
  <div class="chart-container">
    <svg viewBox="0 0 210 88" preserveAspectRatio="none">
      <!-- Smooth curve -->
      <path
        d="M8 68Q55 55 105 40Q150 28 185 18"
        fill="none"
        :stroke="color"
        stroke-width="1.8"
      />

      <!-- End circle -->
      <circle cx="185" cy="18" r="3" :fill="color" />
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  color: string
  ccy?: string
}>()
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 130px;
  border-radius: 4px;
  background: #F8F8F8;
  border: 1px solid #E9EAEC;
  overflow: hidden;
}

.chart-container svg {
  width: 100%;
  height: 100%;
}
</style>
