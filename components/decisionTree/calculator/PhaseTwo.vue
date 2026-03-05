<script setup lang="ts">
</script>

<template>
  <v-container fluid class="py-6 px-6">
    <v-row>
      <v-col>
        <DecisionTreeCalculatorLotTable />
      </v-col>
      <v-col cols="auto" style="width: 280px">
        <DecisionTreeCalculatorRecommendationPanel />
      </v-col>
    </v-row>
  </v-container>
</template>
