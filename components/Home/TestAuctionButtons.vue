<template>
  <div class="d-flex ga-2">
    <v-btn size="large" class="px-8" height="40" @click="dialog = true">
      <v-tooltip
        :text="t('testButtons.tooltip')"
        content-class="bg-white text-black border"
        location="top"
      >
        <template #activator="{ props }">
          <v-icon inline class="mr-2" v-bind="props" icon="mdi-information-outline" />
        </template>
      </v-tooltip>
      {{ t('testButtons.createDemo') }}
    </v-btn>
    <HomeCreateAuctionDialog v-model="dialog" />
  </div>
</template>
<script setup>
// Use translations
const { t } = useTranslations()

const dialog = ref(false)
</script>
