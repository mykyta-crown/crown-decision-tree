<template>
  <div class="text-center">
    <v-dialog v-model="dialog" max-width="700">
      <v-card class="text-center">
        <v-card-title>
          <div class="d-flex w-full justify-space-between align-center">
            <span class="text-body-1 text-grey-lighten-1">
              {{ t('confirmBidDialog.title') }}
            </span>
            <v-btn
              color="grey-lighten-1"
              variant="text"
              icon="mdi-close"
              @click="emit('update:modelValue', false)"
            />
          </div>
          <v-divider class="text-grey-lighten-3" />
        </v-card-title>
        <v-card-text class="mx-2 my-4">
          <div v-if="auction.type === 'dutch'">
            <div class="text-h4 font-weight-bold mb-6">
              <span
                >{{ t('confirmBidDialog.areYouSureSubmitBid') }}
                <span v-if="isPrebid">{{ t('confirmBidDialog.prebidOf') }}</span
                ><span v-else>{{ t('confirmBidDialog.bidOf') }}</span>
              </span>
              <br />
              <span class="mt-1">{{ formattedBidPrice }}?</span>
            </div>
            <AuctionsSuppliesBidsTable :lines-items-bids="isPrebid ? prebid : currentSupplies" />
          </div>

          <div v-else class="text-h4 mb-6 font-weight-bold">
            <template v-if="isPrebid">
              <span>{{ t('confirmBidDialog.areYouSureSubmitPrebid') }}</span> <br />
              <span class="mt-1">{{ formattedBidPrice }}</span>
            </template>
            <template v-else>
              <span
                >{{ t('confirmBidDialog.areYouSureApproveBid') }} <br />{{
                  formattedBidPrice
                }}</span
              >
            </template>
          </div>
          <div v-if="auction.type === 'dutch'">
            <div v-if="isPrebid" class="text-grey mx-8 mt-4 text-body-1">
              <span class="font-weight-bold"
                >{{ t('confirmBidDialog.prebidActivationMessage') }}
              </span>
              <br />
              {{ t('confirmBidDialog.prebidWarningMessage') }}
            </div>
            <div v-else class="text-grey mx-8 mt-4 text-body-1">
              {{ t('confirmBidDialog.dutchBidEndMessage') }}
            </div>
          </div>

          <div v-else class="text-grey text-body-1">
            {{
              isPrebid
                ? t('confirmBidDialog.prebidFinalMessage')
                : t('confirmBidDialog.bidCannotChangeMessage')
            }}
          </div>
        </v-card-text>
        <v-card-actions class="justify-center mb-16 pb-8 ga-8">
          <v-btn-secondary
            class="px-16 w-33"
            size="x-large"
            @click="emit('update:modelValue', false)"
          >
            {{ t('confirmBidDialog.cancel') }}
          </v-btn-secondary>
          <v-btn-primary
            class="rounded-lg px-16 w-33"
            size="x-large"
            :loading="loading"
            @click="confirmBid"
          >
            {{ t('confirmBidDialog.yes') }}
          </v-btn-primary>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const props = defineProps(['modelValue', 'bidPrice', 'isPrebid', 'auctionType'])

const emit = defineEmits(['update:modelValue', 'confirmed'])

// Use translations
const { t } = useTranslations()

const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { currentSupplies } = useDutchRounds(auction)

const dialog = ref(toRef(() => props.modelValue))

const bidPrice = toRef(() => props.bidPrice)
const prebid = inject('prebid')

const loading = ref(false)

const totalBid = computed(() => {
  if (prebid?.value?.length > 0 && props.isPrebid) {
    return prebid.value.reduce((accumulator, currentValue) => accumulator + currentValue.price, 0)
  } else return bidPrice.value
})

const formattedBidPrice = computed(() => {
  return formatNumber(totalBid.value, 'currency', auction?.value.currency)
})

function confirmBid() {
  loading.value = true
  setTimeout(() => {
    emit('update:modelValue', false)
    loading.value = false
  }, 500)
  emit('confirmed', totalBid.value)
}
</script>

<style scoped>
.title {
  line-height: 3rem;
}
.head-text {
  font-size: 1.4rem;
}
</style>
