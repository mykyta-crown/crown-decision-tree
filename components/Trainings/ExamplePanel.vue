<template>
  <v-card
    class="pa-6 hover-card card-transition text-primary card-bg"
    :class="open ? 'card-expanded ' : 'border card-collapsed '"
    elevation="0"
    @click="emit('click')"
  >
    <v-row>
      <v-col cols="12">
        <div class="text-h6 font-weight-bold">{{ title }}{{ open ? extraTitle : '' }}</div>
        <Transition name="content-fade" mode="out-in">
          <div v-if="open && auctionsGroup.length > 0" key="expanded-content" class="mt-3">
            <table class="w-100 text-left">
              <thead>
                <tr>
                  <th v-for="th in thead" :key="th.value">
                    <div v-html="parseMarkdown(th.title)" />
                  </th>
                </tr>
              </thead>
              <tbody class="table-style">
                <TrainingsExamplePanelLotItem
                  v-for="auction in auctionsGroup"
                  :key="auction.id"
                  :auction-id="auction.id"
                  :auction-type="auctionType"
                />
              </tbody>
            </table>
          </div>
        </Transition>
      </v-col>
    </v-row>
  </v-card>
</template>
<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
const { auctionType, open, panel } = defineProps({
  auctionType: {
    type: String,
    required: true
  },
  open: {
    type: Boolean,
    required: true
  },
  panel: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['click'])

const parseMarkdown = (text) => {
  return marked.parse(text)
}
const { t } = useTranslations()

const route = useRoute()

const title = computed(() => {
  return t(`auctionDescriptions.${auctionType}.${panel}.title`)
})
const extraTitle = computed(() => {
  return t(`auctionDescriptions.${auctionType}.${panel}.extraTitle`)
})

const bgColor = computed(() => {
  if (auctionType === 'english') {
    return { 'bg-color': '#F3F2FF', 'hover-bg-color': '#F7F6FF' }
  } else if (auctionType === 'dutch') {
    return { 'bg-color': '#FEFFEA', 'hover-bg-color': '#FFFFF4' }
  } else if (auctionType === 'japanese') {
    return { 'bg-color': '#E9F5FF', 'hover-bg-color': '#F2F9FF' }
  } else {
    return { 'bg-color': '#F3F2FF', 'hover-bg-color': '#F7F6FF' }
  }
})

// Extract CSS-friendly bindings
const hoverBgColor = computed(() => bgColor.value['hover-bg-color'])
const cardBgColor = computed(() => bgColor.value['bg-color'])
const supabase = useSupabaseClient()
const { data: auctionsGroup } = await supabase
  .from('auctions')
  .select('id, type, lot_number')
  .eq('auctions_group_settings_id', route.params.auctionGroupId)
auctionsGroup.sort((a, b) => a.lot_number - b.lot_number)
const thead = computed(() => {
  if (auctionType === 'english' || auctionType === 'sealed-bid') {
    return [
      { title: t(`auctionDescriptions.${auctionType}.${panel}.lot`), value: 'lot' },
      { title: t(`auctionDescriptions.${auctionType}.${panel}.line_item`), value: 'line_item' },
      { title: t(`auctionDescriptions.${auctionType}.${panel}.quantity`), value: 'quantity' },
      {
        title: t(`auctionDescriptions.${auctionType}.${panel}.startingPrice`),
        value: 'startingPrice'
      },
      {
        title: t(`auctionDescriptions.${auctionType}.${panel}.eAuctionTime`),
        value: 'eAuction_time'
      }
    ]
  } else if (auctionType === 'dutch') {
    return [
      { title: t(`auctionDescriptions.${auctionType}.${panel}.lot`), value: 'lot' },
      {
        title: t(`auctionDescriptions.${auctionType}.${panel}.roundIncrement`),
        value: 'roundIncrement'
      },
      { title: t(`auctionDescriptions.${auctionType}.${panel}.roundNumber`), value: 'roundNumber' },
      { title: t(`auctionDescriptions.${auctionType}.${panel}.quantity`), value: 'quantity' },
      {
        title: t(`auctionDescriptions.${auctionType}.${panel}.startingPrice`),
        value: 'startingPrice'
      },
      {
        title: t(`auctionDescriptions.${auctionType}.${panel}.eAuctionTime`),
        value: 'eAuction_time'
      }
    ]
  } else if (auctionType === 'japanese') {
    return [
      { title: t(`auctionDescriptions.${auctionType}.${panel}.lot`), value: 'lot_name' },
      {
        title: t(`auctionDescriptions.${auctionType}.${panel}.roundDecrement`),
        value: 'roundDecrement'
      },
      { title: t(`auctionDescriptions.${auctionType}.${panel}.roundNumber`), value: 'roundNumber' },
      { title: t(`auctionDescriptions.${auctionType}.${panel}.quantity`), value: 'quantity' },
      {
        title: t(`auctionDescriptions.${auctionType}.${panel}.startingPrice`),
        value: 'startingPrice'
      },
      {
        title: t(`auctionDescriptions.${auctionType}.${panel}.eAuctionTime`),
        value: 'eAuction_time'
      }
    ]
  } else {
    return []
  }
})
</script>
<style scoped>
.custom-br-height {
  line-height: 100% !important;
}
.hover-card:hover {
  background-color: v-bind('hoverBgColor') !important;
}
.card-bg {
  background-color: v-bind('cardBgColor') !important;
}
/* Card transition animations */
.card-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.card-expanded {
  /* transform: scale(1.02); */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-collapsed {
  /* transform: scale(1); */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Content fade animations */
.content-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.1s;
}

.content-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.content-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.content-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
table {
  border-collapse: collapse;
  border-spacing: 0;
}
</style>
