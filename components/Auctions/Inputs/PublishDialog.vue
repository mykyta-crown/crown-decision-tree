<template>
  <v-dialog v-model="dialog" width="675px">
    <v-card class="pb-8">
      <v-card-item class="mb-4">
        <v-card-title
          class="text-capitalize text-grey-ligthen-1 d-flex justify-space-between align-center"
        >
          <span>{{ t('publishDialog.title') }}</span>
          <v-icon size="small" icon="mdi-close" @click="dialog = false" />
        </v-card-title>
        <v-divider color="grey-ligthen-2" />
      </v-card-item>
      <v-card-text class="text-center">
        <div class="text-h4 font-weight-bold mb-4">
          {{ t('publishDialog.confirmMessage') }}
        </div>
        <div class="text-grey">
          eAuction "{{ auction.name }}" {{ t('publishDialog.visibilityMessage') }}
        </div>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn-secondary size="large" class="mx-4 px-16" @click="dialog = false">
          {{ t('publishDialog.cancel') }}
        </v-btn-secondary>
        <v-btn-primary class="mx-4 px-16" size="large" :loading="loading" @click="publishAuction">
          {{ t('publishDialog.publish') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const { auction } = defineProps({
  auction: { type: Object, required: true }
})

// Use translations - explicitly load 'auctions' translations since this component
// is used on the home page but translations are in auctions.json
const { t } = useTranslations('auctions')

const supabase = useSupabaseClient()

const dialog = defineModel()
const loading = ref(false)

async function publishAuction() {
  loading.value = true

  await supabase
    .from('auctions')
    .update({
      published: true
    })
    .eq('auctions_group_settings_id', auction.id)

  dialog.value = false
  loading.value = false
}
</script>
