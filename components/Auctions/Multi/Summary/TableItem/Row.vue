<template>
  <v-hover>
    <template #default="{ isHovering, props: hoverProps }">
      <tr
        v-if="auction"
        v-bind="hoverProps"
        class="text-center cursor-pointer relative not-focused"
        :class="[
          isHovering ? 'bg-grey-ligthen-3' : 'bg-white',
          props.currentLot === auction?.id ? 'focus' : ''
        ]"
        @click="handleNavigate"
      >
        <slot />
      </tr>
    </template>
  </v-hover>
</template>
<script setup>
const route = useRoute()

const props = defineProps({
  auctionId: { type: String, required: true },
  currentLot: { type: String, default: null },
  isLast: { type: Boolean, default: false },
  groupId: { type: String, required: true }
})

const { isBuyer } = useUser()
const { auction, fetchAuction } = await useRealtimeAuction({ auctionId: props.auctionId })
await fetchAuction()

const userRole = computed(() => {
  return isBuyer.value ? 'buyer' : 'supplier'
})

function handleNavigate() {
  // Build query params, preserving important ones like bots
  const query = { multilot: 'true' }
  if (route.query.bots) query.bots = route.query.bots
  if (route.query.type) query.type = route.query.type

  const queryString = new URLSearchParams(query).toString()
  navigateTo(`/auctions/${props.groupId}/lots/${auction.value.id}/${userRole.value}?${queryString}`)
}

const boxShadowPosition = props.isLast ? '10px' : '-10px'
</script>
<style scoped>
.relative {
  position: relative;
}

.not-focused {
  z-index: auto !important;
  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0) !important;
  transition: all 0.3s ease-in-out;
  background-color: rgb(var(--v-theme-grey-ligthen-3)) !important;
}

.focus {
  z-index: 10 !important;
  box-shadow: 5px 10px 15px v-bind(boxShadowPosition) rgba(0, 0, 0, 0.1) !important;
  font-weight: 500;
  transition: all 0.3s ease-in-out;
  background-color: white !important;
}
</style>
