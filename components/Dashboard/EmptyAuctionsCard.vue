<template>
  <v-card class="py-16 d-flex flex-column justify-center align-center ga-4 rounded-ts-0">
    <v-img src="/images/no-auction-datatable.png" height="50" width="50" />
    <div class="text-h6">
      {{ t('empty.noEAuctions') }}
    </div>
    <div class="w-33 text-center text-grey-darken-1 text-body-1">
      {{ t('empty.noAuctionsMessage') }}
    </div>
  </v-card>
</template>

<script setup>
const { t } = useTranslations()
</script>
