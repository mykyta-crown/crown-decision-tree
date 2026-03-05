<template>
  <v-dialog v-model="dialog" width="675px">
    <v-card class="pb-8">
      <v-card-item class="mb-4">
        <v-card-title
          class="text-capitalize text-grey-ligthen-1 d-flex justify-space-between align-center"
        >
          <span>{{ t('archiveDialog.title') }}</span>
          <v-icon size="small" icon="mdi-close" @click="dialog = false" />
        </v-card-title>
        <v-divider color="grey-ligthen-2" />
      </v-card-item>
      <v-card-text class="text-center">
        <div class="text-h4 font-weight-bold mb-4">
          {{ t('archiveDialog.confirmMessage') }}
        </div>
        <div class="text-grey">
          eAuction "{{ auction.name }}" {{ t('archiveDialog.warningMessage') }}
        </div>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn-secondary size="large" class="mx-4 px-16" @click="dialog = false">
          {{ t('archiveDialog.cancel') }}
        </v-btn-secondary>
        <v-btn-primary class="mx-4 px-16" size="large" :loading="loading" @click="archiveAuction">
          {{ t('archiveDialog.archive') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const { auction } = defineProps({
  auction: { type: Object, required: true }
})

// Use translations
const { t } = useTranslations()

const { profile } = useUser()
const supabase = useSupabaseClient()

const dialog = defineModel()
const loading = ref(false)

async function archiveAuction() {
  loading.value = true
  await supabase.from('users_auctions_status').upsert({
    auction_id: auction.auction_id,
    user_id: profile.value.id,
    is_archived: true
  })

  dialog.value = false
  loading.value = false
}
</script>
