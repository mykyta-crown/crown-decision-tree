<template>
  <v-container
    class="bg-white border rounded-lg mb-2 px-10 py-8"
    :data-auction-id="auction?.id || ''"
  >
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('termsPage.awardingPrinciples') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pt-2">
        <div class="awarding-html" v-html="auction.awarding_principles" />
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
defineProps(['auction'])

const { t } = useTranslations()
</script>
<style>
.awarding-html ul {
  margin-left: 20px !important;
}
</style>
