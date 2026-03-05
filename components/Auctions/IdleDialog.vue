<template>
  <v-dialog max-width="500" persistent :model-value="showDialog">
    <v-card :title="t('messages.idleTitle')" class="pa-10 text-center">
      <v-card-text>
        {{ t('messages.idleMessage') }}
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn-primary
          size="large"
          color="primary"
          :text="t('actions.stillHere')"
          @click="stillHere"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { useIdle } from '@vueuse/core'

// Use translations
const { t } = useTranslations()

const route = useRoute()
const { updateAuction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { idle } = useIdle(3 * 60 * 1000)
const showDialog = ref(false)

// Check page focus: https://dev.to/j471n/detect-when-users-switch-tabs-using-javascript-3mi3
addEventListener('visibilitychange', () => {
  showDialog.value = true
})
watch(idle, (newIdle) => {
  if (newIdle) showDialog.value = true
})

function stillHere() {
  //TODO: refresh or pull the data
  showDialog.value = false
  updateAuction()
}
</script>
