<template>
  <v-row justify="center" no-gutters>
    <v-col cols="12">
      <v-card-title class="text-center">
        <v-img
          height="130"
          width="130"
          class="mx-auto"
          src="/assets/img/icons/crown_auctions.png"
          alt="Golden crown without rank"
        />
        <div class="font-weight-bold pb-1 pt-6">
          {{ t('languageForm.welcome') }}
        </div>
      </v-card-title>
    </v-col>
    <v-col cols="7">
      <v-card-text class="text-center pt-1">
        {{ t('languageForm.description') }}
      </v-card-text>
    </v-col>
    <v-col cols="7">
      <v-radio-group
        v-model="currentLocale"
        inline
        class="mb-16 mt-6"
        @update:model-value="switchLocale"
      >
        <v-radio :label="t('languageForm.english')" value="en" />
        <v-radio :label="t('languageForm.french')" value="fr" />
      </v-radio-group>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from 'vue'

const { locale, switchLocale, t } = useTranslations()
const currentLocale = ref(locale.value)
</script>
<style scoped>
:deep(.v-selection-control-group) {
  justify-content: center !important;
  gap: 64px !important;
}
</style>
