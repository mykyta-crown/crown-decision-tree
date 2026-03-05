<template>
  <v-row align="center" dense>
    <v-col cols="">
      <v-sheet :color="bgColor" class="py-2 px-2" :border="bgColor !== 'background'" rounded>
        <v-row align="center">
          <v-col cols="4" class="pl-4">
            <slot name="name">
              <span class="text-grey">
                {{ t('userManagement.profilesDataTable.headers.name') }}
              </span>
            </slot>
          </v-col>
          <v-col cols="2">
            <slot name="country">
              <span class="text-grey">
                {{ t('table.country') }}
              </span>
            </slot>
          </v-col>
          <v-col cols="3">
            <slot name="phone">
              <span class="text-grey">
                {{ t('forms.fields.phone') }}
              </span>
            </slot>
          </v-col>
          <v-col cols="2">
            <slot name="status">
              <span class="text-grey">
                {{ t('table.status') }}
              </span>
            </slot>
          </v-col>
          <v-col cols="1" class="text-center">
            <slot name="actions">
              <span class="text-grey">
                {{ t('forms.fields.actions') }}
              </span>
            </slot>
          </v-col>
        </v-row>
      </v-sheet>
    </v-col>
    <v-col class="actions-width">
      <v-row align="center" class="ml-2">
        <v-col cols="4" class="text-center">
          <v-sheet :color="bgColor" class="py-2 px-2" :border="bgColor !== 'background'" rounded>
            <slot name="auctions">
              <span class="text-grey">
                {{ t('table.eAuctions') }}
              </span>
            </slot>
          </v-sheet>
        </v-col>
        <v-col cols="4" class="text-center">
          <v-sheet :color="bgColor" class="py-2 px-2" :border="bgColor !== 'background'" rounded>
            <slot name="buyers">
              <span class="text-grey">
                {{ t('common.buyers') }}
              </span>
            </slot>
          </v-sheet>
        </v-col>
        <v-col cols="4" class="text-center">
          <v-sheet :color="bgColor" class="py-2 px-2" :border="bgColor !== 'background'" rounded>
            <slot name="suppliers">
              <span class="text-grey">
                {{ t('common.suppliers') }}
              </span>
            </slot>
          </v-sheet>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  bgColor: {
    type: String,
    default: 'background'
  }
})

// Use translations
const { t } = useTranslations()
</script>

<style scoped>
.actions-width {
  min-width: 370px;
  max-width: 370px;
}
</style>
