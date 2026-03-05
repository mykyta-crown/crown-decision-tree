<template>
  <v-container
    class="bg-white border rounded-lg mb-2 px-10 py-8"
    :data-auction-id="props.auction?.id || ''"
  >
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('termsPage.generalTerms') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pt-2">
        <div v-if="props.auction.general_terms" class="ml-5" v-html="props.auction.general_terms" />
        <div v-else class="ml-5">
          <ul>
            <li class="mb-1">
              {{ t('termsPage.defaultGeneralTerms.term1') }}
            </li>
            <li class="mb-1">
              {{ t('termsPage.defaultGeneralTerms.term2') }}
            </li>
            <li class="mb-1">
              {{ t('termsPage.defaultGeneralTerms.term3') }}
            </li>
            <li>{{ t('termsPage.defaultGeneralTerms.term4') }}</li>
          </ul>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
const props = defineProps(['auction'])

const { t } = useTranslations()
</script>
