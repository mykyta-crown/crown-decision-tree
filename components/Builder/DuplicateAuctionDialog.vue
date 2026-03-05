<template>
  <v-dialog v-model="dialog" width="675px">
    <v-card class="pb-4">
      <v-card-item class="mb-2">
        <v-card-title
          class="text-capitalize text-grey-ligthen-1 d-flex justify-space-between align-center"
        >
          <span>{{ t('duplication.title') }}</span>
          <v-icon size="small" icon="mdi-close" @click="dialog = false" />
        </v-card-title>
        <v-divider class="mt-1" color="grey-ligthen-2" />
      </v-card-item>
      <v-card-text class="pt-4 px-16 overflow-y-auto">
        <div class="mb-4">{{ t('duplication.chooseType') }}</div>
        <v-radio-group v-model="choice" inline>
          <v-radio :label="t('duplication.duplicateAndUpdate')" value="builder" />
          <v-radio :label="t('duplication.training')" value="training" />
        </v-radio-group>
      </v-card-text>
      <v-card-actions class="pb-8 justify-center">
        <v-btn-secondary size="large" class="px-16" @click="dialog = false">
          {{ t('common.cancel') }}
        </v-btn-secondary>

        <v-btn-primary
          class="px-16 ml-8"
          size="large"
          :loading="loading"
          @click="emit('duplicateChoice', choice)"
        >
          {{
            choice === 'builder'
              ? t('duplication.duplicateAndUpdate')
              : t('duplication.createTrainings')
          }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
defineProps(['loading', 'disabled'])

const emit = defineEmits(['duplicateChoice'])

// Use translations - Force loading builder translations
const { t } = useTranslations('builder')

const dialog = defineModel()
const choice = ref('builder') // Par défaut: dupliquer vers builder
</script>
