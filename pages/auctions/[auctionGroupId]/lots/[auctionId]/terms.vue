<template>
  <div>
    <v-container>
      <!-- Terms tooltip is now shown in AuctionsMultiSummaryTableItemRow -->

      <v-tabs v-model="tabs" hide-slider :class="userType === 'buyer' ? '' : 'h-0'">
        <v-tab
          v-show="userType === 'buyer'"
          class="text-primary custom-tab-border mr-1 px-8"
          :class="tabs === 0 ? 'font-weight-bold' : ''"
        >
          {{ t('termsPage.tabs.terms') }}
        </v-tab>
        <v-tab
          v-show="userType === 'buyer'"
          class="text-primary custom-tab-border px-8"
          :class="tabs === 1 ? 'font-weight-bold' : ''"
        >
          {{ t('termsPage.tabs.status') }}
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tabs">
        <v-tabs-window-item>
          <TermsAllTerms :auction-id="route.params.auctionId" :is-buyer="userType === 'buyer'" />
        </v-tabs-window-item>

        <v-tabs-window-item>
          <TermsAllStatus v-if="userType === 'buyer'" :auction-id="route.params.auctionId" />
        </v-tabs-window-item>
      </v-tabs-window>

      <v-row class="mt-2">
        <v-col cols="10" class="d-flex align-center pt-0">
          <v-checkbox
            v-if="userType === 'seller'"
            v-model="acceptedTerm"
            :disabled="seller && seller.terms_accepted"
            hide-details
          >
            <template #label>
              <span
                >{{ t('termsPage.acceptTerms') }}
                <NuxtLink to="/tos" class="text-primary">
                  {{ t('termsPage.termsOfService') }}
                </NuxtLink>
                {{ t('common.and') }}
                <NuxtLink to="/privacy_policies" class="text-primary">
                  {{ t('termsPage.privacyPolicy') }}
                </NuxtLink>
              </span>
            </template>
          </v-checkbox>
        </v-col>
        <v-col cols="2" class="d-flex align-center justify-end ga-4">
          <template v-if="userType === 'seller'">
            <v-btn-primary
              v-if="!seller.terms_accepted && termsToValidateLeft === 1"
              block
              class="py-6"
              :disabled="!acceptedTerm"
              @click="enterAuctionRoom('seller')"
            >
              {{ t('termsPage.buttons.participate') }}
            </v-btn-primary>
            <v-btn-primary
              v-else
              block
              class="py-6"
              :disabled="!acceptedTerm"
              @click="validateTermsAndGoToNextLot()"
            >
              {{
                terms.length > 1
                  ? t('termsPage.buttons.nextLot')
                  : t('termsPage.buttons.participate')
              }}
            </v-btn-primary>
          </template>
          <template v-else-if="userType === 'buyer'">
            <v-btn-primary block class="py-6" @click="enterAuctionRoom('buyer')">
              {{ t('termsPage.buttons.edit') }}
            </v-btn-primary>
          </template>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { startTour, getVisitorId } from '@intercom/messenger-js-sdk'
const { t } = useTranslations()

const route = useRoute()
const supabase = useSupabaseClient()
const { user, profile, isBuyer } = useUser()
const { updateAuction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const auction = ref(null)
const tabs = ref(0)
const terms = ref([])

const userType = computed(() => {
  console.log(isBuyer.value, isBuyer.value ? 'buyer' : 'seller')
  return isBuyer.value ? 'buyer' : 'seller'
})

const { data: auctionData, error: errorAuction } = await supabase
  .from('auctions')
  .select(
    `
    *,
    supplies(
      *
    ),
    auctions_sellers(*),
    bids(
      *,
      profiles(
        *,
        companies(*)
      ),
      bid_supplies(
        id,
        price,
        supplies(*),
        bids(*)
      )
    )
  `
  )
  .eq('id', route.params.auctionId)
  .order('created_at', { foreignTable: 'bids', ascending: false })

if (errorAuction) {
  console.log(errorAuction)
} else {
  auction.value = auctionData[0]

  // Get all supply IDs from the auction
  const supplyIds = auction.value.supplies.map((supply) => supply.id)

  // Get seller emails from auctions_sellers
  const sellerEmails = auction.value.auctions_sellers.map((as) => as.seller_email)

  // Second, fetch the appropriate supplies_sellers data
  let suppliesSellersData
  if (isBuyer.value) {
    const { data, error } = await supabase
      .from('supplies_sellers')
      .select('*')
      .in('supply_id', supplyIds)
      .in('seller_email', sellerEmails)

    if (!error) {
      suppliesSellersData = data
    }
  } else {
    const { data, error } = await supabase
      .from('supplies_sellers_view')
      .select('*')
      .in('supply_id', supplyIds)
      .in('seller_email', sellerEmails)

    if (!error) {
      suppliesSellersData = data
    }
  }

  // Reconstruct the relationships by adding supplies_sellers to each supply
  auction.value.supplies = auction.value.supplies.map((supply) => ({
    ...supply,
    supplies_sellers: suppliesSellersData.filter((ss) => ss.supply_id === supply.id)
  }))
}

// Check if all terms are validated
const { data: auctionGroup } = await supabase
  .from('auctions')
  .select('id, lot_number')
  .eq('auctions_group_settings_id', auction.value.auctions_group_settings_id)
  .order('lot_number', { ascending: true })

terms.value = await Promise.all(
  auctionGroup.map(async (auction) => {
    const { data } = await supabase
      .from('auctions_sellers')
      .select('terms_accepted, auction_id')
      .eq('seller_email', profile.value.email)
      .eq('auction_id', auction.id)
      .single()
    return data
  })
)

const termsToValidateLeft = computed(() => {
  return terms.value.filter((e) => !e.terms_accepted).length
})

// Multi-lot training detection
const isMultiLotTraining = computed(() => {
  return (
    route.query.multilot === 'true' &&
    (route.query.usage === 'training' || route.query.usage === 'test')
  )
})

// Check if all terms are accepted across all lots
const allTermsAccepted = computed(() => {
  if (!terms.value || terms.value.length === 0) return true
  return terms.value.every((t) => t?.terms_accepted)
})

// Fonction pour valider les termes et passer au lot suivant
async function validateTermsAndGoToNextLot() {
  const { error: errorInsert } = await supabase
    .from('auctions_sellers')
    .update({ terms_accepted: true })
    .eq('seller_email', user.value.email)
    .eq('auction_id', route.params.auctionId)

  if (errorInsert) {
    console.log('errorInsert: ', errorInsert)
  }

  const nextOpenLot = auctionGroup.find((e) => {
    const seller = terms.value.find((t) => t.auction_id === e.id)
    return !seller.terms_accepted && e.id !== route.params.auctionId
  })

  // Build query string properly
  const queryParams = new URLSearchParams()
  if (route.query.type) queryParams.set('type', route.query.type)
  if (route.query.multilot) queryParams.set('multilot', route.query.multilot)
  const queryString = queryParams.toString() ? '?' + queryParams.toString() : ''

  if (!nextOpenLot) {
    navigateTo(
      `/auctions/${auction.value.auctions_group_settings_id}/lots/${auctionGroup[0].id}/supplier${queryString}`
    )
    return
  }
  navigateTo(
    `/auctions/${auction.value.auctions_group_settings_id}/lots/${nextOpenLot.id}/terms${queryString}`
  )
}

async function enterAuctionRoom(type) {
  const firstAuction = auctionGroup[0].id
  if (!firstAuction) {
    console.log('No auction found')
    return
  }

  // Build query string properly
  const queryParams = new URLSearchParams()
  if (route.query.type) queryParams.set('type', route.query.type)
  if (route.query.multilot) queryParams.set('multilot', route.query.multilot)
  const queryString = queryParams.toString() ? '?' + queryParams.toString() : ''

  if (type === 'seller') {
    const { error: errorInsert } = await supabase
      .from('auctions_sellers')
      .update({ terms_accepted: true })
      .eq('seller_email', user.value.email)
      .eq('auction_id', route.params.auctionId)
    if (errorInsert) {
      console.log('errorInsert: ', errorInsert)
    }
    updateAuction()
    navigateTo(
      `/auctions/${auction.value.auctions_group_settings_id}/lots/${firstAuction}/supplier${queryString}`
    )
  } else {
    // For buyer, use auction_id as first param
    const buyerParams = new URLSearchParams()
    buyerParams.set('auction_id', firstAuction)
    if (route.query.type) buyerParams.set('type', route.query.type)
    if (route.query.multilot) buyerParams.set('multilot', route.query.multilot)
    navigateTo(`/builder?${buyerParams.toString()}`)
  }
}

const seller = computed(() => {
  return auction.value.auctions_sellers.find((e) => e.seller_email === user.value.email) || false
})
const acceptedTerm = ref(seller.value.terms_accepted || false)

// onMounted(async () => {
//   console.log('onMounted', isBuyer.value, auction.value.usage)
//   if (!isBuyer.value && (auction.value.usage === 'training' || auction.value.usage === 'test')) {
//     console.log('startTour', '630377')
//     const visitorId = getVisitorId()
//     startTour('630377', {
//       visitorId
//     })
//   }
// })
</script>
<style scoped>
.custom-tab-border {
  border-radius: 4px 4px 0 0 !important;
  border: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  background: white;
}

.terms-guidance-anchor {
  width: 100%;
  height: 1px;
}
</style>
