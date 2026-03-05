<template>
  <v-row class="mt-3 pt-16" justify="center">
    <v-col>
      <v-card-title class="text-center">
        <v-img
          height="130"
          width="130"
          class="mx-auto"
          src="/assets/img/icons/Without_rank.svg"
          alt="Golden crown without rank"
        />
        <div class="font-weight-bold pb-1 pt-6">
          {{ t('finalForm.title') }}
        </div>
      </v-card-title>
    </v-col>
    <v-col cols="7" class="pb-16 mb-13">
      <v-card-text class="text-center pt-1">
        {{ t('finalForm.description') }}
      </v-card-text>
    </v-col>
  </v-row>
</template>

<script setup>
const { t } = useTranslations()
</script>
<style scoped>
:deep(.v-selection-control-group) {
  justify-content: center !important;
  gap: 64px !important;
}
</style>
