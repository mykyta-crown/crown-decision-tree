<template>
  <v-container :fluid="width < 1440">
    <v-breadcrumbs :items="breadcrumbs" density="compact" class="pl-1 pb-0">
      <template #divider>
        <v-img src="@/assets/icons/basic/Chevron_right.svg" width="16" height="16" />
      </template>
    </v-breadcrumbs>
    <v-row>
      <v-col class="px-4">
        <v-expansion-panels v-model="selectedStep" flat>
          <BuilderBasicsStep v-model="basics" :is-selected="selectedStep === 0" />
          <BuilderSuppliersStep v-model="suppliers" :is-selected="selectedStep === 1" />
          <BuilderLotsStep
            v-if="lots"
            v-model="lots"
            :suppliers="suppliers"
            :basics="basics"
            :is-selected="selectedStep === 2"
          />
        </v-expansion-panels>
      </v-col>
    </v-row>
    <v-row>
      <v-spacer />
      <v-col cols="auto" class="d-flex justify-end">
        <v-btn
          v-if="!isCopy"
          size="large"
          block
          variant="flat"
          color="primary"
          :disabled="disable"
          :loading="loading"
          @click="submit('createOrEdit')"
        >
          {{ btnText }}
        </v-btn>
        <v-btn
          v-else
          size="large"
          block
          variant="flat"
          color="primary"
          :disabled="disable"
          :loading="loading"
          @click="dialog = true"
        >
          {{ btnText }}
        </v-btn>
        <BuilderDuplicateAuctionDialog
          v-model="dialog"
          :loading="loading"
          :disabled="disable"
          @duplicate-choice="copy"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import _ from 'lodash'
import dayjs from 'dayjs'
import slugify from 'slugify'
import { until } from '@vueuse/core'

const { width } = useDisplay()
const { t, pending } = useTranslations()

const { getSession } = useUser()
const { user, profile } = await getSession()
const { fetchProfiles } = useEmailToProfile()
const config = useRuntimeConfig()

const selectedStep = ref(0)
const route = useRoute()
const router = useRouter()
// No need for localePath anymore

const breadcrumbs = computed(() => [
  {
    title: t('breadcrumbs.eAuctions'),
    to: '/home'
  },
  {
    title: t('breadcrumbs.createEAuction'),
    to: '/builder'
  }
])

const isCopy = computed(() => {
  return route.query.copy === 'true'
})

const btnText = computed(() => {
  if (isDuplicateMode.value) {
    return t('pageActions.duplicateEAuction')
  } else if (route.query.auction_id) {
    return isCopy.value ? t('pageActions.copyEAuction') : t('pageActions.edit')
  } else {
    return t('pageActions.createEAuction')
  }
})

const supabase = useSupabaseClient()

const isAuctionClosed = ref(false)
const loading = ref(false)
// Basic refer to the data common to all lots.
const basics = ref({
  name: '',
  description: '',
  prefered: false,
  max_rank_displayed: 100,
  date: dayjs().add(1, 'day'),
  time: dayjs().format('HH:mm'),
  currency: 'EUR',
  timezone: 'CEST',
  type: 'reverse',
  test: true,
  company_id: profile.value?.company_id,
  buyer_id: user.value?.id,
  log_visibility: 'only_own',
  published: false,
  usage: config.public.vercelEnv === 'production' ? 'training' : 'test'
})

const suppliers = ref(null)
const lots = ref([])
const defaultAuction = ref(null)
const defaultLots = ref(null)
const timingRule = ref('serial')
const dialog = ref(false)
const isDuplicateMode = ref(false)
const originalType = ref(null)

const groupId = ref(null)
provide('timingRuleInjection', timingRule)

async function fetchAuctions(auctionId) {
  const { data: routerAuction } = await supabase
    .from('auctions')
    .select('auctions_group_settings_id')
    .eq('id', auctionId)
    .single()

  const { data: auctions_timing } = await supabase
    .from('auctions_group_settings')
    .select('timing_rule')
    .eq('id', routerAuction.auctions_group_settings_id)
    .single()

  groupId.value = routerAuction.auctions_group_settings_id
  timingRule.value = auctions_timing?.timing_rule || 'serial'

  const { data: auctions } = await supabase
    .from('auctions')
    .select('*, auctions_sellers(*), supplies(*, supplies_sellers(*)) ')
    .eq('auctions_group_settings_id', groupId.value)
    .order('lot_number', { ascending: true })
    .order('index', { foreignTable: 'supplies', ascending: true })

  return { auctions }
}

function setBasicData(auctionData) {
  basics.value = Object.assign(basics.value, {
    id: auctionData.id,
    name: auctionData.name,
    max_rank_displayed: auctionData.max_rank_displayed,
    prefered: auctionData.auctions_sellers.find((seller) => seller.time_per_round),
    description: auctionData.description,
    date: dayjs(auctionData.start_at).set('second', 0),
    time: dayjs(auctionData.start_at).set('second', 0).format('HH:mm'),
    currency: auctionData.currency,
    timezone: auctionData.timezone,
    type: auctionData.type,
    test: auctionData.test,
    company_id: auctionData.company_id,
    buyer_id: auctionData.buyer_id,
    log_visibility: auctionData.log_visibility,
    usage: auctionData.usage ?? 'training',
    published: auctionData.published
  })
}

async function convertAuctionsToLots(auctions) {
  return Promise.all(
    auctions.map(async (auctionData) => {
      const { data: auctionHandicaps } = await supabase
        .from('auctions_handicaps')
        .select('*')
        .eq('auction_id', auctionData.id)

      const formatedHandicaps = auctionHandicaps.map((handicap) => {
        return {
          name: handicap.group_name,
          option: handicap.option_name,
          supplier: handicap.seller_email,
          amount: handicap.amount
        }
      })
      const { data: auctionDocs } = await supabase.storage
        .from('commercials_docs')
        .list(`${groupId.value}/${auctionData.id}/`)

      const commercials_docs = await Promise.all(
        (auctionDocs || []).map(async (file) => {
          const { data } = await supabase.storage
            .from('commercials_docs')
            .getPublicUrl(`${groupId.value}/${auctionData.id}/${file.name}`)
          return {
            name: file.name,
            url: data.publicUrl,
            id: file.id,
            auction_id: auctionData.id,
            groupId: groupId.value
          }
        })
      )

      //#TODO A check
      const got_fixed_handicap = auctionData.supplies.some((supply) =>
        supply.supplies_sellers.some(
          (seller) => seller.additive !== 0 || seller.multiplicative !== 1
        )
      )

      const formattedLots = {
        id: auctionData.id,
        name: auctionData.lot_name,
        max_rank_displayed: auctionData.max_rank_displayed,
        duration: auctionData.duration,
        baseline: auctionData.baseline,
        multiplier: auctionData.multiplier,
        rank_trigger: auctionData.rank_trigger,
        min_bid_decr: auctionData.min_bid_decr,
        min_bid_decr_type: auctionData.min_bid_decr_type,
        max_bid_decr: auctionData.max_bid_decr,
        max_bid_decr_type: auctionData.max_bid_decr_type,
        overtime_range: auctionData.overtime_range,
        awarding_principles: auctionData.awarding_principles,
        commercials_terms: auctionData.commercials_terms,
        commercials_docs,
        general_terms: auctionData.general_terms,
        dutch_prebid_enabled: auctionData.dutch_prebid_enabled,
        rank_per_line_item: auctionData.rank_per_line_item || false,
        suppliers: auctionData.auctions_sellers
          .filter((seller) => seller.auction_id === auctionData.id)
          .map((e) => ({ email: e.seller_email })),
        suppliersTimePerRound: auctionData.auctions_sellers
          .filter((seller) => seller.auction_id === auctionData.id)
          .map((e) => ({ email: e.seller_email, time_per_round: e.time_per_round })),
        got_fixed_handicap: got_fixed_handicap, // #TODO replace with real data
        show_fixed_handicap_calculations: false, // #TODO replace with real data
        got_dynamic_handicap: formatedHandicaps.length,
        handicaps: formatedHandicaps || []
      }

      const items = auctionData.supplies.map((supply, i) => {
        const suppliersData = formattedLots.suppliers.map((seller) => {
          const findSupplySeller = supply.supplies_sellers.find(
            (e) => e.seller_email === seller.email
          )
          let mult = {}
          if (findSupplySeller.multiplier) {
            mult = { [`mult_${seller.email}`]: findSupplySeller.multiplier }
          }
          let fixedHandicap = {}
          const additive = findSupplySeller.additive
          const multiplicative = findSupplySeller.multiplicative

          if (additive !== null && additive !== 0) {
            fixedHandicap = {
              [`handi_type_${seller.email}`]: additive > 0 ? '+' : '-',
              [`handi_value_${seller.email}`]: Math.abs(additive)
            }
          } else if (multiplicative !== null && multiplicative !== 1) {
            fixedHandicap = {
              [`handi_type_${seller.email}`]: '*',
              [`handi_value_${seller.email}`]: multiplicative
            }
          } else {
            fixedHandicap = {
              [`handi_type_${seller.email}`]: '+',
              [`handi_value_${seller.email}`]: 0
            }
          }
          return { [seller.email]: findSupplySeller.ceiling, ...mult, ...fixedHandicap }
        })

        const flatSuppliersData = suppliersData.reduce((r, c) => Object.assign(r, c), {})

        return {
          ...flatSuppliersData,
          id: supply.id,
          line_item: supply.name,
          unit: supply.unit,
          quantity: supply.quantity,
          index: i
        }
      })
      return {
        ...formattedLots,
        items
      }
    })
  )
}

// formatExistingAuction parse auction basics and lots.
async function formatExistingAuction(auctionId) {
  const { auctions } = await fetchAuctions(auctionId)
  const auctionData = auctions[0]

  defaultAuction.value = auctionData
  setBasicData(auctionData)

  isAuctionClosed.value = dayjs(auctionData.end_at).isBefore(dayjs())

  const auctionSellers = auctions
    .map((auction) => auction.auctions_sellers)
    .reduce((acc, val) => acc.concat(val), [])
  defaultAuction.value.auctions_sellers = auctionSellers

  defaultLots.value = await convertAuctionsToLots(auctions)
  const enrichedSellers = await fetchProfiles(_.uniqBy(auctionSellers, 'seller_email'))

  const auctions_sellers = enrichedSellers.map((seller) => {
    //TODO: Utiliser le useContactList ?
    if (seller.seller_profile) {
      return {
        email: seller.seller_profile.email,
        phone: seller.seller_profile.phone,
        company: seller.seller_profile.companies?.name,
        address: seller.seller_profile.companies?.address,
        country: seller.seller_profile.companies?.country,
        contact: seller.seller_profile.firstname,
        id: '',
        position: '',
        isNew: false
      }
    } else {
      return {
        email: seller.seller_email,
        phone: seller.seller_phone,
        isNew: true
      }
    }
  })
  suppliers.value = auctions_sellers

  lots.value = await convertAuctionsToLots(auctions)
  // console.log('lots.value: ', lots.value)
}

// Mode duplication : charger depuis sessionStorage
if (route.query.mode === 'duplicate') {
  const { getDuplicateState } = useDuplicateAuctionState()
  const state = getDuplicateState()

  if (state) {
    // Pré-remplir avec les données de duplication
    // Convertir les dates/times de string vers dayjs objects pour compatibilité avec le submit
    const basicsWithDayjs = {
      ...state.basics,
      date: dayjs(state.basics.date), // Convertir "2025-01-15" vers dayjs object
      time: state.basics.time // Garder le time en string format "HH:mm"
    }

    // Remove any ID or group_id to ensure fresh auction creation
    delete basicsWithDayjs.id
    delete basicsWithDayjs.group_id

    basics.value = basicsWithDayjs
    suppliers.value = state.suppliers
    lots.value = state.lots
    timingRule.value = state.timingRule
    isDuplicateMode.value = true
    originalType.value = state.originalType

    console.log('[Builder] Mode duplication activé:', {
      name: basics.value.name,
      type: basics.value.type,
      lotCount: lots.value.length,
      supplierCount: suppliers.value.length
    })

    // Forcer la revalidation après le chargement des données
    // Attendre que le DOM soit mis à jour
    await nextTick()

    // Forcer la réactivité en créant de nouvelles références pour déclencher les computed properties
    // Ceci est nécessaire car validLots dépend à la fois de lots.value ET de basics.value.type
    basics.value = { ...basics.value }
    suppliers.value = [...suppliers.value]
    lots.value = [...lots.value]

    // Attendre une frame supplémentaire pour s'assurer que les validations sont recalculées
    await new Promise((resolve) => setTimeout(resolve, 0))
  } else {
    // Pas d'état de duplication trouvé, rediriger vers home
    console.warn('[Builder] Mode duplication mais aucun état trouvé')
    router.push('/home')
  }
} else if (route.query.auction_id) {
  await formatExistingAuction(route.query.auction_id)
} else {
  // Wait for translations to load before adding default lot
  await until(() => !pending.value).toBe(true)
  addLot()
}

const validLots = computed(() => {
  return lots.value.every((lot) => {
    const validItems = lot.items.every((item) => {
      return Object.values(item).every((e) => e !== undefined && e !== null && e !== '')
    })
    // console.log('validItems', validItems)

    const validDuration = basics.value.type === 'sealed-bid' ? true : lot.duration > 0
    const validOvertime = basics.value.type === 'sealed-bid' ? true : lot.overtime_range > 0
    const validMinDec = basics.value.type === 'sealed-bid' ? true : lot.min_bid_decr > 0
    const validMaxDec = basics.value.type === 'sealed-bid' ? true : lot.max_bid_decr > 0
    const validBasics =
      lot.baseline > 0 &&
      validDuration &&
      validOvertime &&
      validMinDec &&
      validMaxDec &&
      lot.name !== '' &&
      lot.awarding_principles !== '<p><br></p>' &&
      lot.commercials_terms !== '<p><br></p>' &&
      lot.general_terms !== '<p><br></p>'

    // console.log('validBasics', validBasics, lot)

    return lot.suppliers.length > 0 && lot.items.length > 0 && validItems && validBasics
  })
})

const validBasics = computed(() => {
  const objectToTest = Object.assign({}, basics.value)
  delete objectToTest.prefered
  delete objectToTest.description
  return Object.values(objectToTest).every((e) => e !== undefined && e !== null && e !== '')
})

const disable = computed(() => {
  return (
    !validBasics.value ||
    (suppliers.value ? suppliers.value.length == 0 : !suppliers.value) ||
    !validLots.value
  )
})

function addLot() {
  lots.value.push({
    name: `${t('lots.lot')} ${lots.value.length + 1}`,
    duration: basics.value.type === 'sealed-bid' ? 0 : 5,
    max_rank_displayed: basics.value.max_rank_displayed,
    baseline: 0,
    multiplier: true,
    rank_trigger: 'all',
    min_bid_decr: 0,
    min_bid_decr_type: basics.value.currency,
    max_bid_decr: 0,
    max_bid_decr_type: basics.value.currency,
    overtime_range: basics.value.type === 'sealed-bid' ? 0 : 1,
    suppliers: [],
    suppliersTimePerRound: [],
    items: [],
    commercials_docs: [],
    awarding_principles: t('lots.defaultAwardingPrinciples'),
    commercials_terms: t('lots.defaultCommercialTerms'),
    general_terms: t('lots.defaultGeneralTerms'),
    dutch_prebid_enabled: true,
    got_fixed_handicap: false,
    show_fixed_handicap_calculations: false,
    got_dynamic_handicap: false,
    handicaps: [],
    rank_per_line_item: false
  })
}

async function submit(duplicateChoice) {
  loading.value = true

  console.log('[Builder] SUBMIT called:', {
    duplicateChoice,
    isDuplicateMode: isDuplicateMode.value,
    currentGroupId: groupId.value
  })

  console.log('basics.value:', basics.value.date)
  console.log('basics.value.time:', basics.value.time)
  console.log('time', basics.value.time.split(':')[0], basics.value.time.split(':')[1])

  const startDate = basics.value.date
    .set('hour', basics.value.time.split(':')[0])
    .set('minute', basics.value.time.split(':')[1])
    .set('second', 0)
    .set('millisecond', 0)

  console.log('startDate:', startDate)

  // if (duplicateChoice !== 'createOrEdit') {
  //   startDate = dayjs().add(1, 'day').set('hour', basics.value.time.split(':')[0])
  //     .set('minute', basics.value.time.split(':')[1])
  //     .set('second', 0)
  //     .set('millisecond', 0)
  // }

  // NEW
  function formatFixedHandicap(item, email, type) {
    const handiType = item[`handi_type_${email}`]
    const handiValue = item[`handi_value_${email}`]
    if (type === 'additive') {
      return handiType === '+' || handiType === '-' ? parseInt(handiType + handiValue) : 0
    } else if (type === 'multiplicative') {
      if (handiType === '*') {
        return parseFloat(handiValue)
      } else {
        return 1
      }
    }
  }

  const lotsFormattedBis = lots.value.map((lot, i) => {
    const suppliers_prices = lot.suppliers.map((supplier) => {
      const lines_items = lot.items.map((lineItem, i) => {
        return {
          id: lineItem.id,
          line_item: lineItem.line_item,
          quantity: lineItem.quantity,
          unit: lineItem.unit,
          ceiling: lineItem[supplier.email],
          multiplier: lineItem[`mult_${supplier.email}`],
          additive: +formatFixedHandicap(lineItem, supplier.email, 'additive'),
          multiplicative: +formatFixedHandicap(lineItem, supplier.email, 'multiplicative'),
          index: i
        }
      })

      return { supplier, lines_items }
    })

    let lotStart = startDate.add(0, 'm')

    if (timingRule.value === 'serial') {
      let cumulativeDuration = 0
      if (i > 0) {
        cumulativeDuration = lots.value.slice(0, i).reduce((total, prevLot) => {
          return total + +prevLot.duration
        }, 0)
      }
      lotStart = startDate.add(cumulativeDuration, 'm')
    }

    return {
      ...lot,
      start_at: lotStart.toISOString(),
      end_at: lotStart.add(+lot.duration, 'm').toISOString(),
      lot_number: i + 1,
      suppliers_prices,
      rank_per_line_item: lot.rank_per_line_item || false
    }
  })

  if (!groupId.value) {
    const { data: newGroups } = await supabase
      .from('auctions_group_settings')
      .insert({
        name: basics.value.name,
        description: basics.value.description,
        buyer_id: basics.value.buyer_id,
        timing_rule: timingRule.value
      })
      .select()

    groupId.value = newGroups[0].id
  } else {
    await supabase.from('auctions_group_settings').upsert({
      id: groupId.value,
      name: basics.value.name,
      description: basics.value.description,
      buyer_id: basics.value.buyer_id,
      timing_rule: timingRule.value
    })
  }

  const auction = {
    group_id: groupId.value,
    ...basics.value,
    start_at: startDate.toISOString(),
    end_at: startDate.add(parseInt(lotsFormattedBis[0].duration), 'minute').toISOString(),
    awarding_principles: lotsFormattedBis[0].awarding_principles, //TODO: a mettre niveau lot
    commercials_terms: lotsFormattedBis[0].commercials_terms, //TODO: a mettre niveau lot
    general_terms: lotsFormattedBis[0].general_terms, //TODO: a mettre niveau lot
    lots: lotsFormattedBis
  }

  // console.log('SEND AUCTION: ', auction.lots)

  if (defaultAuction.value && duplicateChoice === 'createOrEdit') {
    lots.value.forEach(async (lot) => {
      const defaultLot = defaultLots.value.find((l) => l.id === lot.id)

      // If it's a new lot, we don't need to remove anything
      if (defaultLot) {
        // Remove sellers from defaultLot
        const removedSellers = _.differenceWith(
          defaultLot.suppliers,
          lot.suppliers,
          (arrVal, othVal) => {
            return arrVal.email === othVal.email
          }
        )

        const { error: errorRmAS } = await supabase
          .from('auctions_sellers')
          .delete()
          .eq('auction_id', defaultLot.id)
          .in(
            'seller_email',
            removedSellers.map((e) => e.email)
          )

        const { error: errorRmSS } = await supabase
          .from('supplies_sellers')
          .delete()
          .in(
            'supply_id',
            defaultLot.items.map((e) => e.id)
          )
          .in(
            'seller_email',
            removedSellers.map((e) => e.seller_email)
          )

        if (errorRmAS || errorRmSS) {
          console.log('errorRmAS ', defaultLot.name, ':', errorRmAS, ' - errorRmSS:', errorRmSS)
        }

        const removedLinesItems = _.differenceWith(
          defaultLot.items,
          lot.items,
          (arrVal, othVal) => arrVal.id === othVal.id
        )
        await supabase
          .from('supplies')
          .delete()
          .in(
            'id',
            removedLinesItems.map((e) => e.id)
          )
          .select()
      }
    })

    defaultLots.value.forEach(async (defaultLot) => {
      const lot = lots.value.find((l) => l.id === defaultLot.id)

      // Lot has been removed
      if (!lot) {
        await supabase.from('auctions').delete().eq('id', defaultLot.id)
      }
    })
  }

  if (isAuctionClosed.value && duplicateChoice == 'createOrEdit') {
    auction.start_at = defaultAuction.value.start_at
    auction.end_at = defaultAuction.value.end_at

    auction.lots.forEach((lot) => {
      const defaultLot = defaultLots.value.find((l) => l.id === lot.id)

      if (defaultLot) {
        lot.start_at = defaultLot.start_at
        lot.end_at = defaultLot.end_at
      }
    })
  }

  const dataToSubmit = { ...auction }
  // CRITICAL: Remove all IDs to create fresh auction without bids/prebids/logs
  // When duplicating or creating training auctions, we must delete all IDs so that:
  // 1. create_auction_v5_2 RPC creates NEW records instead of updating existing ones
  // 2. The new auction has no bids, prebids, or logs from the original
  // 3. A new auction group is created (not reusing the original group_id)
  if (duplicateChoice !== 'createOrEdit' || isDuplicateMode.value) {
    // Remove auction ID to force creation of new auction
    delete dataToSubmit.id

    if (duplicateChoice === 'flat') {
      // For flat duplication, create new group here
      const { data: newGroups } = await supabase
        .from('auctions_group_settings')
        .insert({
          name: 'Copy of' + basics.value.name,
          description: basics.value.description,
          buyer_id: basics.value.buyer_id,
          timing_rule: timingRule.value
        })
        .select()
      console.log('flat duplicate, newGroupsId:', newGroups[0])
      dataToSubmit.group_id = newGroups[0].id
      dataToSubmit.name = 'Copy of ' + basics.value.name
    }
    // NOTE: For isDuplicateMode, group_id was already created by lines 558-569
    // and assigned to auction.group_id on line 581. We keep it, don't delete it!

    // Remove all lot and item IDs to force creation of new records
    dataToSubmit.lots.forEach((lot) => {
      delete lot.id
      // Remove IDs from items array if it exists
      if (lot.items && Array.isArray(lot.items)) {
        lot.items.forEach((item) => {
          delete item.id
        })
      }
      // Remove IDs from suppliers_prices structure
      if (lot.suppliers_prices && Array.isArray(lot.suppliers_prices)) {
        lot.suppliers_prices.forEach((prices) => {
          if (prices.lines_items && Array.isArray(prices.lines_items)) {
            prices.lines_items.forEach((line) => {
              delete line.id
            })
          }
        })
      }
      // Remove IDs from commercials_docs to prevent linking to old documents
      if (lot.commercials_docs && Array.isArray(lot.commercials_docs)) {
        lot.commercials_docs.forEach((doc) => {
          delete doc.id
          delete doc.auction_id
        })
      }
    })

    console.log('[Builder] IDs removed for fresh auction creation:', {
      isDuplicateMode: isDuplicateMode.value,
      duplicateChoice,
      hasAuctionId: !!dataToSubmit.id,
      hasGroupId: !!dataToSubmit.group_id,
      groupId: dataToSubmit.group_id,
      lotCount: dataToSubmit.lots.length,
      lotIds: dataToSubmit.lots.map((l) => l.id),
      firstLotItemIds: dataToSubmit.lots[0]?.items?.map((i) => i.id) || []
    })
  }

  // Additional verification: ensure we're creating a fresh auction
  console.log('[Builder] Final dataToSubmit check before RPC:', {
    hasAuctionId: !!dataToSubmit.id,
    hasGroupId: !!dataToSubmit.group_id,
    defaultAuctionExists: !!defaultAuction.value,
    isDuplicateMode: isDuplicateMode.value
  })

  //===== START  Duplication de l'auction par supplier=====
  if (duplicateChoice === 'training') {
    dataToSubmit.usage = 'training'
    const fullSuppliersList = _.uniq(
      dataToSubmit.lots.map((lot) => lot.suppliers.map((e) => e.email)).flat()
    )
    console.log('suppliersList:', fullSuppliersList)

    const supplierPresenceInLots = fullSuppliersList.map((email) => {
      return {
        email,
        lots: dataToSubmit.lots
          .filter((lot) => lot.suppliers.find((e) => e.email === email))
          .map((lot) => lot.name)
      }
    })
    // const suppliersNumber = fullSuppliersList.length
    // Create training auction for each suppliers and reatribute any other supplier included in the lots as supplier+n
    Promise.all(
      supplierPresenceInLots.map(async (supplier) => {
        const lots = dataToSubmit.lots.filter((lot) =>
          lot.suppliers.find((e) => e.email === supplier.email)
        )
        console.log(supplier.email, 'lots presence:', lots)

        const existingPlaceholders = fullSuppliersList
          .filter((email) => /^supplier\+\d+@crown\.ovh$/.test(email))
          .map((email) => parseInt(email.match(/\d+/)[0], 10))

        const nextPlaceholderIndex =
          existingPlaceholders.length > 0 ? Math.max(...existingPlaceholders) + 1 : 1

        const newLots = lots.map((lot) => {
          const sortedLotSuppliers = lot.suppliers.sort((a) =>
            a.email === supplier.email ? -1 : 1
          )
          let placeholderCounter = nextPlaceholderIndex

          const suppliers = sortedLotSuppliers.map((e) => {
            if (e.email === supplier.email || /^supplier\+\d+@crown\.ovh$/.test(e.email)) {
              return e
            }
            const placeholder = { email: `supplier+${placeholderCounter}@crown.ovh` }
            placeholderCounter++
            return placeholder
          })

          console.log('suppliers listing:', supplier.email, suppliers)

          const sortedSuppliersPrices = lot.suppliers_prices.sort((a) =>
            a.supplier.email === supplier.email ? -1 : 1
          )

          let pricePlaceholderCounter = nextPlaceholderIndex

          const suppliers_prices = sortedSuppliersPrices.map((e) => {
            if (
              e.supplier.email === supplier.email ||
              /^supplier\+\d+@crown\.ovh$/.test(e.supplier.email)
            ) {
              return e
            }
            const pricePlaceholder = {
              supplier: { email: `supplier+${pricePlaceholderCounter}@crown.ovh` },
              lines_items: e.lines_items
            }
            pricePlaceholderCounter++
            return pricePlaceholder
          })

          return {
            ...lot,
            suppliers,
            suppliers_prices
          }
        })

        const { data: newGroups } = await supabase
          .from('auctions_group_settings')
          .insert({
            name: basics.value.name + 'Training' + supplier.email,
            description: basics.value.description,
            buyer_id: basics.value.buyer_id,
            timing_rule: timingRule.value
          })
          .select()

        return {
          ...dataToSubmit,
          group_id: newGroups[0].id || 0,
          name: `${dataToSubmit.name} - Training ${supplier.email}`,
          lots: newLots
        }
      })
    )
      .then((res) => {
        console.log('fullfiled:', res)
        Promise.all(
          res.map(async (auction, i) => {
            const data = await supabase
              .rpc('create_auction_v5_2', { auction: auction })
              .then(async (res) => {
                // console.log('auction upserted', auction.lots)
                if (auction.lots.map((e) => e.commercials_docs).length > 0) {
                  const { data: auctionsArray } = await supabase
                    .from('auctions')
                    .select('id')
                    .eq('auctions_group_settings_id', auction.group_id)
                    .order('lot_number', { ascending: true })
                  console.log('auctionsArray:', auctionsArray)
                  console.log('LOTS:', lots)
                  lots.value.forEach((lot, i) => {
                    console.log('SINGLE lot:', lot)
                    if (lot.commercials_docs.length > 0) {
                      lot.commercials_docs.map(async (commercial_doc) => {
                        const filePath = `${auction.group_id}/${auctionsArray[i].id}/${slugify(commercial_doc.name)}`

                        const { data: existingFile, error: fileError } = await supabase.storage
                          .from('commercials_docs')
                          .list(`${auction.group_id}/${auctionsArray[i].id}/`)

                        const fileExists = existingFile.find(
                          (f) => f.name === slugify(commercial_doc.name)
                        )

                        if (fileError) {
                          console.log('Error checking file existence:', fileError)
                        }
                        // If the file does not exist, upload it
                        if (!fileExists) {
                          const { data, error } = await supabase.storage
                            .from('commercials_docs')
                            .upload(filePath, commercial_doc, {
                              headers: {
                                'x-upsert': 'true'
                              }
                            })
                          console.log('file uploaded', data)
                          console.log('error upload file', error)
                        } else {
                          console.log('File already exists, skipping upload:', filePath)
                        }
                      })
                    }
                  })
                }
                console.log('LOTs:', auction.lots)
                console.log('auctions:', res)
                return res.data
              })
              .catch((err) => {
                console.log('- ERROR', err)
                return
              })

            if (data) {
              loading.value = false
              console.log('data:', i, data)
              if (i == 0) {
                console.log('test data', data)
              }

              await router.push('/home')
            }
          })
        )
      })
      .catch((err) => {
        console.log('- ERROR', err)
        return
      })
    // ===== END OF DUPLICATION ====
  } else {
    console.log('auction Object submitted:', dataToSubmit)
    // ------------------------------
    const { data: upsertedAuctionId } = await supabase.rpc('create_auction_v5_2', {
      auction: dataToSubmit
    })
    // console.log('auction upserted', auction.lots)
    if (auction.lots.map((e) => e.commercials_docs).length > 0) {
      const { data: auctionsArray } = await supabase
        .from('auctions')
        .select('id')
        .eq('auctions_group_settings_id', dataToSubmit.group_id)
        .order('lot_number', { ascending: true })

      console.log('auctionsArray:', auctionsArray)
      console.log('LOTS:', lots)

      for (let i = 0; i < lots.value.length; i++) {
        const lot = lots.value[i]
        // lots.value.forEach((lot, i) => {
        console.log('SINGLE lot:', lot)
        if (lot.commercials_docs.length > 0) {
          for (let j = 0; j < lot.commercials_docs.length; j++) {
            const commercial_doc = lot.commercials_docs[j]
            const filePath = `${dataToSubmit.group_id}/${auctionsArray[i].id}/${slugify(commercial_doc.name)}`

            const { data: existingFile, error: fileError } = await supabase.storage
              .from('commercials_docs')
              .list(`${dataToSubmit.group_id}/${auctionsArray[i].id}/`)

            const fileExists = existingFile.find((f) => f.name === slugify(commercial_doc.name))

            if (fileError) {
              console.log('Error checking file existence:', fileError)
            }
            // If the file does not exist, upload it
            if (!fileExists) {
              const { data, error } = await supabase.storage
                .from('commercials_docs')
                .upload(filePath, commercial_doc, {
                  headers: {
                    'x-upsert': 'true'
                  }
                })
              console.log('file uploaded', data)
              console.log('error upload file', error)
            } else {
              console.log('File already exists, skipping upload:', filePath)
            }
          }
        }
        // })
      }
    }

    console.log('lots:', auction.lots)
    console.log('create_auction_v5_2 data:', upsertedAuctionId)

    loading.value = false

    // Nettoyer l'état de duplication après sauvegarde réussie
    if (isDuplicateMode.value) {
      const { clearDuplicateState } = useDuplicateAuctionState()
      clearDuplicateState()
    }

    // await router.push(`/auctions/${groupId.value}/lots/${upsertedAuctionId}/buyer`)
    window.location.href = `/auctions/${groupId.value}/lots/${upsertedAuctionId}/buyer`
  }
}

function copy(duplicateChoice) {
  submit(duplicateChoice)
}

// Watcher universel : réinitialiser les paramètres de lots lors d'un changement de type
// S'applique à TOUS les modes (create, edit, duplicate) pour éviter les erreurs de configuration
watch(
  () => basics.value?.type,
  (newType, oldType) => {
    if (oldType && newType !== oldType && lots.value?.length > 0) {
      console.log("[Builder] Type d'enchère modifié:", oldType, '→', newType)

      // Réinitialiser les paramètres spécifiques au type
      lots.value = lots.value.map((lot) => ({
        ...lot,
        // Conserver les champs génériques
        id: lot.id,
        name: lot.name,
        suppliers: lot.suppliers,
        suppliersTimePerRound: lot.suppliersTimePerRound,
        items: lot.items,
        handicaps: lot.handicaps,
        got_fixed_handicap: lot.got_fixed_handicap,
        got_dynamic_handicap: lot.got_dynamic_handicap,
        commercials_docs: lot.commercials_docs,
        awarding_principles: lot.awarding_principles,
        commercials_terms: lot.commercials_terms,
        general_terms: lot.general_terms,

        // Réinitialiser les champs spécifiques au type
        duration: basics.value.type === 'sealed-bid' ? 0 : 5,
        baseline: null,
        min_bid_decr: null,
        max_bid_decr: null,
        min_bid_decr_type: null,
        max_bid_decr_type: null,
        overtime_range: basics.value.type === 'sealed-bid' ? 0 : 1,
        dutch_prebid_enabled: basics.value.type !== 'sealed-bid',
        rank_per_line_item: false,
        max_rank_displayed: basics.value.max_rank_displayed,
        rank_trigger: 'all',
        multiplier: null
      }))

      // Afficher un avertissement seulement en mode duplication ou édition
      // En mode création normale, changer de type est un comportement attendu
      if (isDuplicateMode.value || route.query.auction_id) {
        const toast = useToast()
        toast.warning(t('duplication.typeChangedWarning'))
      }
    }
  }
)

// Nettoyer l'état de duplication si l'utilisateur quitte le builder sans sauvegarder
onBeforeUnmount(() => {
  if (isDuplicateMode.value) {
    const { clearDuplicateState } = useDuplicateAuctionState()
    clearDuplicateState()
  }
})

// When suppliers are removed, clean up lot-level suppliers and handicaps
watch(
  suppliers,
  (newSuppliers) => {
    if (!newSuppliers || !lots.value) return

    const validEmails = new Set(newSuppliers.map((s) => s.email))

    lots.value.forEach((lot) => {
      // Clean up lot suppliers
      if (lot.suppliers) {
        lot.suppliers = lot.suppliers.filter((s) => validEmails.has(s.email))
      }
      // Clean up handicaps
      if (lot.handicaps) {
        lot.handicaps = lot.handicaps.filter((h) => validEmails.has(h.supplier))
      }
      // Clean up suppliersTimePerRound
      if (lot.suppliersTimePerRound) {
        lot.suppliersTimePerRound = lot.suppliersTimePerRound.filter((s) =>
          validEmails.has(s.email)
        )
      }
    })
  },
  { deep: true }
)

watch(basics.value, () => {
  // Sync max_rank_displayed to all lots when it changes in basics
  // This ensures Japanese No-Rank setting is properly propagated
  lots.value.forEach((lot) => {
    lot.max_rank_displayed = basics.value.max_rank_displayed
  })

  // Dutch auctions: force max_rank_displayed = 1 (only winner sees rank)
  if (basics.value.type === 'dutch') {
    basics.value.max_rank_displayed = 1
    lots.value.forEach((lot) => {
      lot.max_rank_displayed = 1
    })
  }

  if (basics.value.type === 'reverse' || basics.value.type === 'sealed-bid') {
    // Otherwise textfield are disabled in lotform datatable
    lots.value.forEach((lot) => {
      lot.dutch_prebid_enabled = basics.value.type !== 'sealed-bid'
      if (basics.value.type === 'sealed-bid') {
        lot.duration = 0
        lot.overtime_range = 0
        lot.min_bid_decr = 0
        lot.max_bid_decr = 0
      }
      if (basics.value.type !== 'sealed-bid') {
        if (lot.min_bid_decr === 0) lot.min_bid_decr = 1
        if (lot.max_bid_decr === 0) lot.max_bid_decr = 1
      }
    })
  }
})
</script>

<style scoped>
:deep(.v-breadcrumbs-divider) {
  padding-inline: 0px !important;
}

/* Override Vuetify's default max-width constraint on v-container */
:deep(.v-container) {
  max-width: none !important;
}
</style>
