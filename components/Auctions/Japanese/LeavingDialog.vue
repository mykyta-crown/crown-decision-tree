<template>
  <div class="text-center">
    <v-dialog v-model="model" max-width="700">
      <v-card class="text-center">
        <v-card-title>
          <div class="d-flex w-full justify-space-between align-center">
            <span class="text-h4 text-grey-lighten-1">
              {{ t('japanese.leavingDialog.title') }}
            </span>
            <v-btn
              color="grey-lighten-1"
              variant="text"
              icon="mdi-close"
              @click="emit('update:modelValue', false)"
            />
          </div>
          <v-divider class="text-grey-lighten-3" />
        </v-card-title>
        <v-card-text class="mx-16">
          <img height="200" width="300" src="/images/auction-loser.svg" />
          <div>
            <span class="text-h4 font-weight-bold">{{
              t('japanese.leavingDialog.confirmMessage')
            }}</span>
            <div class="mt-6 text-grey font-weight-regular text-body">
              {{ t('japanese.leavingDialog.warningMessage') }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="justify-center mb-8 pb-8 ga-8">
          <v-btn-secondary
            class="px-16 w-33"
            size="x-large"
            @click="emit('update:modelValue', false)"
          >
            <!-- #TODO BODIFIER CE EMIT POUR Quitter l'auction -->
            {{ t('japanese.leavingDialog.cancel') }}
          </v-btn-secondary>
          <v-btn-primary class="rounded-lg px-16 w-33" size="x-large" @click="confirmLeaving">
            {{ t('japanese.leavingDialog.leave') }}
          </v-btn-primary>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const emit = defineEmits(['update:modelValue', 'redirect'])

// Use translations
const { t } = useTranslations()

const model = defineModel()

function confirmLeaving() {
  emit('redirect')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.title {
  line-height: 3rem;
}
.head-text {
  font-size: 1.4rem;
}
</style>
