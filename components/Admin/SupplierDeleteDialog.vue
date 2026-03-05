<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>{{ t('admin.supplierDeleteDialog.removeSupplier') }}</v-card-title>
      <v-card-text>
        {{ t('admin.supplierDeleteDialog.confirmMessage') }} <br />
        <span class="font-weight-bold">{{ selectedSupplier.name }}</span>
      </v-card-text>
      <v-card-actions>
        <v-btn-secondary color="primary" @click="handleClose">
          {{ t('admin.supplierDeleteDialog.cancel') }}
        </v-btn-secondary>
        <v-btn-primary color="error" @click="handleRemoveSupplier">
          {{ t('admin.supplierDeleteDialog.remove') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  auction: {
    type: Object,
    required: true
  },
  selectedSupplier: {
    type: Object,
    required: true
  }
})

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()
const router = useRouter()

const dialog = defineModel()

const loading = ref(false)

async function handleClose() {
  dialog.value = false
}

async function handleRemoveSupplier() {
  loading.value = true

  try {
    if (props.selectedSupplier.id) {
      await supabase
        .from('bids')
        .delete()
        .eq('auction_id', props.auction.id)
        .eq('seller_id', props.selectedSupplier.id)
    }

    await supabase
      .from('auctions_sellers')
      .delete()
      .eq('auction_id', props.auction.id)
      .eq('seller_email', props.selectedSupplier.email)

    await supabase
      .from('auctions')
      .update({
        last_bid_time: new Date().toISOString()
      })
      .eq('id', props.auction.id)

    // We need to refresh the page to reload the auction data.
    router.go()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
    dialog.value = false
  }
}
</script>
