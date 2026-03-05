<template>
  <v-card color="surface" class="custom-border h-100">
    <v-container class="py-2 px-0 max-card-height">
      <v-row>
        <v-col cols="12">
          <v-table fixed-header density="comfortable" class="scrollbar-custom">
            <thead>
              <tr>
                <th class="text-left">
                  <v-card-title class="font-weight-black pa-0 pt-2 pb-3">
                    {{ t('activityLog.title') }}
                  </v-card-title>
                </th>
                <th v-if="showRankHeader" class="text-center text-grey text-body-2 col-rank">
                  {{ auction.type === 'reverse' ? t('activityLog.rank') : t('activityLog.round') }}
                </th>
                <th class="text-end text-grey text-body-2 col-time">
                  {{ t('activityLog.time') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <KeepAlive>
                <v-slide-y-transition group>
                  <AuctionsLogsItemsComponentWrapper
                    v-for="(log, i) in retrievedLogs"
                    :key="`${log.type}-${log.timestamp * i}`"
                    :log="log"
                  />
                </v-slide-y-transition>
              </KeepAlive>
            </tbody>
          </v-table>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>
<script setup>
// Use translations
const { auctionId } = defineProps({
  auctionId: {
    type: String,
    required: true
  }
})
const { t } = useTranslations()

const route = useRoute()
const { user, isAdmin } = useUser()

const { auction } = await useUserAuctionBids({ auctionId })
const { logs, clearLocalLogs } = await useAuctionLogs({
  auctionId: auctionId,
  auctionGroupId: route.params.auctionGroupId
})

// Provide clearLocalLogs to child components (e.g., AuctionResetDialog)
provide('clearLocalLogs', clearLocalLogs)

// Register clearLocalLogs with parent (buyer.vue) so training reset can clear stale logs
const registerClearLocalLogs = inject('registerClearLocalLogs', null)
if (registerClearLocalLogs) {
  registerClearLocalLogs(clearLocalLogs)
}

// Check if user is a seller (not admin and not buyer)
const isSeller = computed(() => {
  return !isAdmin.value && auction.value?.buyer_id !== user.value?.id
})

// Show rank header only if: admin/buyer OR (seller AND rank display enabled)
const showRankHeader = computed(() => {
  return !isSeller.value || auction.value?.max_rank_displayed > 0
})

const retrievedLogs = computed(() => {
  return logs.value.map((l) => l).sort((a, b) => b.timestamp - a.timestamp)
})

// Provide showRankHeader to child log components
provide('showRankInLogs', showRankHeader)
</script>

<style scoped>
tr td,
tr th,
tr,
thead,
tbody,
table,
th {
  border-bottom: none !important;
  border-top: none !important;
  border: none !important;
  border-image-width: 0;
  box-shadow: none !important;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
.list-move {
  transition: transform 0.5s ease;
}
.custom-border {
  border-top-right-radius: 0px !important;
}
.max-card-height {
  max-height: 242px !important;
}
.scrollbar-custom {
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
}
.scrollbar-custom :deep(.v-table__wrapper) {
  overflow-x: hidden;
}
.scrollbar-custom :deep(table) {
  table-layout: fixed;
  width: 100%;
}
/* Column widths for fixed table layout */
.col-rank {
  width: 78px;
}
.col-time {
  width: 95px;
}
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar {
  width: 3px;
}
/* Track */
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-track {
  border: 7px solid #f8f8f8;
  background: #f8f8f8;
  border-radius: 20px;
  height: 50px;
}

/* Handle */
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-thumb {
  border: 6px solid #c5c7c9;
  border-radius: 9px;
  background-clip: content-box;
}

/* Handle on hover */
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: #c5c7c9;
  border: 5px solid #d4d5d5;
  height: 2px;
  border-radius: 9px;
  background-clip: content-box;
}
</style>
<style>
.relative {
  position: relative;
}
</style>
