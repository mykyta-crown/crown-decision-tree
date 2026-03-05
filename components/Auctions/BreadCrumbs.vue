<template>
  <v-breadcrumbs color="white" class="bread py-0 my-0" :items="breadItems">
    <template #divider>
      <v-icon icon="mdi-chevron-right" color="white" />
    </template>
  </v-breadcrumbs>
</template>

<script setup>
const props = defineProps({
  auctionId: {
    type: String,
    required: true
  },
  isBuyer: {
    default: false,
    type: Boolean
  }
})

const supabase = useSupabaseClient()

const { data: auction } = await supabase
  .from('auctions')
  .select('name, lot_name, auctions_group_settings_id')
  .eq('id', props.auctionId)
  .single()

const route = useRoute()

const breadItems = computed(() => {
  const items = [
    {
      title: 'Home',
      to: '/home'
    },
    {
      title: auction?.name
    },
    {
      title: auction?.lot_name,
      to: `/auctions/${auction.auctions_group_settings_id}/lots/${props.auctionId}/${props.isBuyer ? 'buyer' : 'supplier'}`
    }
  ]

  if (route.path.includes('terms')) {
    items.push({
      title: 'Terms',
      to: `/auctions/${auction.auctions_group_settings_id}/lots/${props.auctionId}/terms`
    })
  }

  return items
})
</script>
<style scoped>
.bread:deep(.v-breadcrumbs-item--disabled) {
  opacity: 1;
  color: white !important;
}
</style>
