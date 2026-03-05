<template>
  <tr class="max-td-height">
    <td class="text-grey">
      <span class="d-flex align-center">
        <v-icon v-if="icon" :color="color" :icon="icon" />
        <div v-else-if="customIcon">
          <slot name="custom-icon" />
        </div>

        <div class="ml-2 text-truncate max-width">
          <slot />
        </div>
      </span>
    </td>
    <td v-if="showRank" class="text-center">
      <div class="d-flex align-center justify-center">
        <v-chip
          v-if="rank && rank > 0"
          variant="text"
          class="font-weight-bold rounded-lg d-flex align-center justify-center"
          :style="{ 'background-color': rankColor, height: '28px', width: '28px' }"
        >
          <span>{{ rank }}</span>
        </v-chip>
      </div>
    </td>
    <td class="text-end">
      {{ time }}
    </td>
  </tr>
</template>

<script setup>
defineProps(['icon', 'color', 'time', 'rank', 'rankColor', 'customIcon'])

// Check if we should show rank column (injected from BidsLogsCard)
const showRank = inject('showRankInLogs', ref(true))
</script>
<style scoped>
td {
  border: none !important;
  height: 26px !important;
}
tr {
  height: 34px !important;
}
@media screen and (max-width: 850px) {
  .max-width {
    max-width: 100px;
  }
}
@media screen and (min-width: 960px) and (max-width: 1160px) {
  .max-width {
    max-width: 120px !important;
  }
}
@media screen and (max-width: 1200px) {
  .max-width {
    max-width: 220px;
  }
}
@media screen and (min-width: 1200px) {
  .max-width {
    max-width: 240px;
  }
}
@media screen and (min-width: 1440px) {
  .max-width {
    max-width: 350px;
  }
}
@media screen and (min-width: 1600px) {
  .max-width {
    max-width: 410px;
  }
}
@media screen and (min-width: 1920px) {
  .max-width {
    max-width: 100%;
  }
}
</style>
