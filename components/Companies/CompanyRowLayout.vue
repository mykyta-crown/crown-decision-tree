<template>
  <v-row align="center" dense>
    <v-col cols="">
      <v-sheet :color="bgColor" height="44" class="py-2 px-2" rounded>
        <v-row align="center">
          <v-col cols="4" class="pl-4 py-1">
            <slot name="name">
              <span class="text-grey">
                {{ t('forms.fields.name') }}
              </span>
            </slot>
          </v-col>
          <v-col cols="2" class="py-1">
            <slot name="country">
              <span class="text-grey">
                {{ t('forms.fields.country') }}
              </span>
            </slot>
          </v-col>
          <v-col cols="3" class="py-1">
            <slot name="phone">
              <span class="text-grey">
                {{ t('forms.fields.phone') }}
              </span>
            </slot>
          </v-col>
          <v-col cols="2" class="py-1">
            <slot name="status">
              <span class="text-grey">
                {{ t('auction.status.label') }}
              </span>
            </slot>
          </v-col>
          <v-col cols="1" class="text-center py-1">
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
      <v-row align="center">
        <v-row align="center" class="ml-2">
          <v-col cols="4" class="text-center">
            <v-sheet :color="bgColor" height="44" class="py-2 px-2" rounded>
              <slot name="superBuyers">
                <span class="text-grey">
                  {{ t('common.superBuyers') }}
                </span>
              </slot>
            </v-sheet>
          </v-col>
          <v-col cols="4" class="text-center">
            <v-sheet :color="bgColor" height="44" class="py-2 px-2" rounded>
              <slot name="buyers">
                <span class="text-grey">
                  {{ t('buyers') }}
                </span>
              </slot>
            </v-sheet>
          </v-col>
          <v-col cols="4" class="text-center">
            <v-sheet :color="bgColor" height="44" class="py-2 px-2" rounded>
              <slot name="suppliers">
                <span class="text-grey">
                  {{ t('suppliers') }}
                </span>
              </slot>
            </v-sheet>
          </v-col>
        </v-row>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup>
defineProps({
  bgColor: {
    type: String,
    default: 'white'
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
