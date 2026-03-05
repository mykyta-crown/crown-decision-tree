<template>
  <v-card variant="text">
    <v-card-text>
      <v-row no-gutters justify="start">
        <v-col v-for="(round, i) in displayedRounds" :key="i" cols="4" md="2">
          <v-chip
            variant="flat"
            color="grey-ligthen-3"
            size="large"
            class="mr-2 mb-4 py-5 rounded-lg price-tag d-flex justify-center chip-border"
          >
            <span class="text-grey">
              {{ formatNumber(round.price) }}
            </span>
          </v-chip>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps(['roundsList'])

const displayedRounds = computed(() => props.roundsList)
</script>

<style scoped>
.price-tag {
  width: 102px !important;
}
.chip-border {
  border: 1px solid #e0e0e0;
  border-radius: 4px !important;
}

.prebid-chip-border {
  border: 1px solid rgb(var(--v-theme-green));
  border-radius: 4px !important;
}
</style>
