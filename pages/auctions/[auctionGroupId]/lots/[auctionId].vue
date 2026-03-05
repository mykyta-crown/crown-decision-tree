<template>
  <div>
    <NuxtPage v-if="auction && !loading" />
  </div>
</template>

<script setup>
import { watch } from 'vue'

const supabase = useSupabaseClient()
const router = useRouter()

const { profile } = useUser()

async function updateLastConnection() {
  await supabase
    .from('auctions_sellers')
    .update({
      last_connection: new Date().toISOString()
    })
    .eq('seller_email', profile.value?.email)
}

if (profile.value?.role === 'supplier') {
  updateLastConnection()
}

const route = useRoute()
const { auction, loading } = await useUserAuctionBids({ auctionId: route.params.auctionId })

// Wait for loading to be false before proceeding
await new Promise((resolve) => {
  if (!loading.value) {
    resolve()
  } else {
    watch(
      loading,
      (newLoading) => {
        if (!newLoading) {
          resolve()
        }
      },
      { once: true }
    )
  }
})

const { status } = useAuctionTimer(auction)

// Update URL with auction status
watch(
  status,
  (newStatus) => {
    if (newStatus?.label) {
      const currentQuery = { ...route.query }
      currentQuery.status = status.value.label
      currentQuery.usage = auction.value.usage
      currentQuery.type = auction.value.type
      if (route.query.multilot) {
        currentQuery.multilot = route.query.multilot
      }

      // Update the URL without triggering a page reload
      router.replace({
        query: currentQuery
      })
    }
  },
  { immediate: true }
)

const { startBots, stopBots, setAuctionId } = await useTrainingBots({
  auctionId: route.params.auctionId,
  auctionGroupId: route.params.auctionGroupId
})

// Check if bots should run (training/test auctions always have bots, or explicit ?bots=true)
const shouldRunBots = computed(() => {
  const isTraining = auction.value?.usage === 'training' || auction.value?.usage === 'test'
  const hasBotsParam = route.query?.bots === 'true' || route.query?.bots === true
  const botsDisabled = route.query?.bots === 'false'

  // For training auctions, run bots unless explicitly disabled
  // For other auctions, only run if ?bots=true
  return isTraining ? !botsDisabled : hasBotsParam
})

// Watch for lot switches (auctionId changes in multi-lot auctions)
watch(
  () => route.params.auctionId,
  (newAuctionId, oldAuctionId) => {
    if (newAuctionId && newAuctionId !== oldAuctionId) {
      setAuctionId(newAuctionId)
      // The shouldRunBots watcher will handle starting bots
    }
  }
)

// Start/stop bots based on auction type, query params, and lot changes
watch(
  [shouldRunBots, () => route.params.auctionId],
  ([shouldRun]) => {
    if (shouldRun) {
      startBots()
    } else {
      stopBots()
    }
  },
  { immediate: true }
)
</script>
