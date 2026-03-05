<template>
  <v-dialog v-model="dialog" width="675px">
    <v-card class="pb-4">
      <v-card-item class="mb-2">
        <v-card-title
          class="text-capitalize text-grey-ligthen-1 d-flex justify-space-between align-center"
        >
          <span>{{ t('deleteDialog.title') }}</span>
          <v-icon size="small" icon="mdi-close" @click="dialog = false" />
        </v-card-title>
        <v-divider class="mt-1" color="grey-ligthen-2" />
      </v-card-item>
      <v-card-text class="text-center pt-4 pb-8 px-16">
        <div class="text-h4 font-weight-bold mb-4">
          {{ t('deleteDialog.confirmMessage') }}
        </div>
        <div class="text-error font-weight-bold">
          {{ groupIdList.length }} {{ t('deleteDialog.warningMessage') }}
        </div>
        <div class="text-grey darken-1 mt-4">
          {{ t('deleteDialog.irreversibleWarning') }}
        </div>
      </v-card-text>
      <v-card-actions class="justify-center pb-8">
        <v-btn-secondary size="large" class="px-16" @click="handleCancel">
          {{ t('deleteDialog.cancel') }}
        </v-btn-secondary>
        <v-btn-primary class="px-16 ml-8" size="large" :loading="loading" @click="deleteAuction">
          {{ t('deleteDialog.delete') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const { groupIdList } = defineProps({
  groupIdList: { type: Array, required: true }
})
const emit = defineEmits(['delete', 'cancel'])
// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()
const dialog = defineModel()
const loading = ref(false)

function handleCancel() {
  dialog.value = false
  emit('cancel')
}

async function deleteAuction() {
  loading.value = true
  console.log(groupIdList)

  const { data: auctionsGroup } = await supabase
    .from('auctions')
    .select('id')
    .in('auctions_group_settings_id', groupIdList)

  // Handle case where query fails or returns no auctions
  if (!auctionsGroup || auctionsGroup.length === 0) {
    console.warn('[DeleteDialog] No auctions found for group IDs:', groupIdList)
    loading.value = false
    dialog.value = false
    emit('delete')
    return
  }

  await supabase
    .from('auctions')
    .update({
      deleted: true
    })
    .in(
      'id',
      auctionsGroup.map((a) => a.id)
    )

  dialog.value = false
  loading.value = false
  emit('delete', groupIdList)
}
</script>
