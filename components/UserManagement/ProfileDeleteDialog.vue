<template>
  <v-dialog v-model="dialog" max-width="400px">
    <v-card>
      <v-card-title class="text-h6 d-flex justify-space-between align-center">
        {{ t('userManagement.profileDeleteDialog.title') }}
        <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false" />
      </v-card-title>
      <v-divider />
      <v-card-text class="py-6 text-center">
        {{ t('userManagement.profileDeleteDialog.confirmMessage') }}
      </v-card-text>
      <v-card-actions class="justify-center mb-4">
        <v-btn-secondary min-width="120" :disabled="loading" @click="dialog = false">
          {{ t('userManagement.profileDeleteDialog.cancel') }}
        </v-btn-secondary>
        <v-btn color="error" min-width="120" :loading="loading" @click="handleDelete">
          {{ t('userManagement.profileDeleteDialog.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  profileId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)

async function handleDelete() {
  loading.value = true
  await supabase.from('profiles').update({ is_deleted: true }).eq('id', props.profileId)
  loading.value = false
  dialog.value = false
}
</script>
