<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h6 d-flex justify-space-between align-center">
        {{ t('auctionResetDialog.title') }}
        <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false" />
      </v-card-title>
      <v-divider />
      <v-card-text class="py-6 d-flex justify-center align-center flex-column">
        <div class="text-h5 font-weight-bold mb-4 text-center">
          {{ t('auctionResetDialog.confirmMessage') }}
        </div>
        <div class="text-grey-darken-1 mb-4 text-center">
          {{ t('auctionResetDialog.warningMessage') }}
        </div>

        <!-- Bot Option -->
        <v-checkbox
          v-model="playAgainstBots"
          :label="t('auctionResetDialog.playAgainstBots')"
          color="primary"
          class="mb-2"
          hide-details
        />

        <!-- Bot Warning Message -->
        <v-alert v-if="playAgainstBots" type="warning" variant="tonal" class="mb-4">
          <div class="text-body-2">
            {{ getBotWarningMessage() }}
          </div>
        </v-alert>
      </v-card-text>
      <v-card-actions class="justify-center mb-4">
        <v-btn-secondary min-width="120" :disabled="loading" @click="dialog = false">
          {{ t('auctionResetDialog.cancel') }}
        </v-btn-secondary>
        <v-btn-primary min-width="120" :loading="loading" @click="handleReset">
          {{ t('auctionResetDialog.reset') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  auctionId: {
    type: String,
    required: true
  },
  auctionGroupId: {
    type: String,
    default: null
  }
})

const dialog = defineModel({ type: Boolean })

// Use translations
const { t } = useTranslations()

// Get auction data to determine type
const { auction } = await useUserAuctionBids({ auctionId: props.auctionId })

// Inject functions for UI refresh after reset
const forceRefresh = inject('forceRefresh', null)
const clearLocalLogs = inject('clearLocalLogs', null)

const loading = ref(false)
const playAgainstBots = ref(false)

const router = useRouter()
const { resetAuction } = useAuctionReset()

function getBotWarningMessage() {
  const auctionType = auction.value?.type

  if (auctionType === 'dutch' || auctionType === 'japanese') {
    return t('auctionResetDialog.botWarningDutchJapanese')
  } else if (auctionType === 'reverse' || auctionType === 'sealed-bid') {
    return t('auctionResetDialog.botWarningEnglish')
  } else {
    return t('auctionResetDialog.botWarningDefault')
  }
}

async function handleReset() {
  loading.value = true

  try {
    dialog.value = false

    await resetAuction(props.auctionId, props.auctionGroupId, {
      includeBots: playAgainstBots.value,
      forceRefresh,
      clearLocalLogs,
      onSuccess: (query) => router.replace({ query })
    })
  } catch (error) {
    console.error('Reset failed:', error)
    alert('Le reset a échoué. Veuillez recharger la page.')
  } finally {
    loading.value = false
  }
}
</script>
