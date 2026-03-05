<template>
  <v-container fluid class="py-6 px-6">
    <v-row>
      <v-col cols="12" md="3">
        <SpendCard />
      </v-col>
      <v-col cols="12" md="3">
        <SupplierCountCard />
      </v-col>
      <v-col cols="12" md="3">
        <AwardMethodCard />
      </v-col>
      <v-col cols="12" md="3">
        <StatusCard />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import SpendCard from '~/components/decisionTree/calculator/SpendCard.vue'
import SupplierCountCard from '~/components/decisionTree/calculator/SupplierCountCard.vue'
import AwardMethodCard from '~/components/decisionTree/calculator/AwardMethodCard.vue'
import StatusCard from '~/components/decisionTree/calculator/StatusCard.vue'
</script>
