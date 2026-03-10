<script setup lang="ts">
</script>

<template>
  <v-container fluid class="py-6 px-6">
    <div class="phase2-layout">
      <div class="phase2-table">
        <DecisionTreeCalculatorLotTable />
      </div>
      <div class="phase2-panel">
        <DecisionTreeCalculatorRecommendationPanel />
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.phase2-layout {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.phase2-table {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.phase2-panel {
  width: 190px;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .phase2-layout {
    flex-direction: column;
  }
  .phase2-panel {
    width: 100%;
  }
}
</style>
